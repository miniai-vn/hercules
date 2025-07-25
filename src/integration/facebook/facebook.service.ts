import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios, { AxiosResponse } from 'axios';
import { Queue } from 'bullmq';
import dayjs from 'dayjs';
import * as dotenv from 'dotenv';
import { ChannelsService } from 'src/channels/channels.service';
import { ChannelType } from 'src/channels/dto/channel.dto';
import { ChatService } from 'src/chat/chat.service';
import { HttpMethod } from 'src/common/enums/http-method.enum';
import { isAfter } from 'src/common/utils/utils';
import { ConversationsService } from 'src/conversations/conversations.service';
import { CustomersService } from 'src/customers/customers.service';
import { v4 as uuidv4 } from 'uuid';
import { FACEBOOK_CONFIG } from './config/facebook.config';
import { FacebookWebhookDTO } from './dto/facebook-webhook.dto';
import { FacebookUserProfileQueryDTO } from './dto/facebook.dto';
import { FacebookHttpService } from './facebook-http.service';
import { FacebookTokenService } from './facebook-token.service';
import { TPageInfo } from './types/page.type';

import { Producer } from 'kafkajs';
import { MessageType } from 'src/common/enums/message.enum';
import { KafkaProducerService } from 'src/kafka/kafka.producer';
import { TUserProfile } from './types/user.type';
dotenv.config();
Injectable();
export class FacebookService {
  private readonly hubMode = 'subscribe';
  private readonly topic = process.env.KAFKA_FACEBOOK_MESSAGE_TOPIC;
  private producer: Producer;
  constructor(
    private readonly channelService: ChannelsService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    private readonly facebookHttpService: FacebookHttpService,
    private readonly facebookTokenService: FacebookTokenService,
    private readonly conversationService: ConversationsService,
    private readonly customerService: CustomersService,
    private readonly kafkaProducerService: KafkaProducerService,
    @InjectQueue(process.env.REDIS_FACEBOOK_SYNC_TOPIC)
    private readonly facebookSyncQueue: Queue,
  ) {
    this.producer = this.kafkaProducerService.getProducer();
  }

  async connectToFacebook(): Promise<string> {
    const csrf = uuidv4();
    const statePayload = { csrf };
    const state = encodeURIComponent(JSON.stringify(statePayload));

    const fbAuthUrl = new URL(
      `${FACEBOOK_CONFIG.FACEBOOK_PATH}${FACEBOOK_CONFIG.ENDPOINT.DIALOG_OAUTH}`,
    );

    fbAuthUrl.searchParams.append('display', 'page');
    fbAuthUrl.searchParams.append('client_id', FACEBOOK_CONFIG.APP.ID);
    fbAuthUrl.searchParams.append('redirect_uri', FACEBOOK_CONFIG.REDIRECT_URL);
    fbAuthUrl.searchParams.append('scope', FACEBOOK_CONFIG.SCOPE);
    fbAuthUrl.searchParams.append('state', state);

    return fbAuthUrl.toString();
  }

  async callbackFacebook(code: string): Promise<string> {
    if (!code) {
      throw new InternalServerErrorException('Missing code in callback');
    }

    try {
      const tokenUser = await this.getLongLiveTokenUser(code);

      const pages = await this.getTokenPages(tokenUser);

      const tokenPage = pages.map((page) => {
        return {
          id: page.id,
          name: page.name,
          access_token: page.access_token,
          avatar: page.picture.data.url,
        };
      });

      for (const page of tokenPage) {
        const existingChannel = await this.channelService.getByTypeAndAppId(
          ChannelType.FACEBOOK,
          page.id,
        );

        if (existingChannel) {
          await this.channelService.update(existingChannel.id, {
            userToken: tokenUser,
            accessToken: page.access_token,
            name: page.name,
          });
        } else {
          await this.channelService.create({
            appId: page.id,
            name: page.name,
            accessToken: page.access_token,
            type: ChannelType.FACEBOOK,
            avatar: page.avatar,
            userToken: tokenUser,
          });
        }
      }

      const idPage = tokenPage
        .map((page) => {
          return page.id;
        })
        .join(',');

      return `${process.env.DASHBOARD_BASE_URL}/dashboard/channels?type=facebook&appId=${idPage}`;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  private async getLongLiveTokenUser(code: string): Promise<string> {
    const endpoint = `${FACEBOOK_CONFIG.ENDPOINT.OAUTH_ACCESS_TOKEN}`;
    const params = {
      client_id: FACEBOOK_CONFIG.APP.ID,
      client_secret: FACEBOOK_CONFIG.APP.SECRET,
      redirect_uri: FACEBOOK_CONFIG.REDIRECT_URL,
      code,
    };

    try {
      const shortTokenResp = await this.facebookHttpService.callFacebookAPI(
        endpoint,
        HttpMethod.GET,
        params,
        undefined,
        FACEBOOK_CONFIG.BASE_PATH_FACEBOOK,
      );

      const shortLivedToken = shortTokenResp.data.access_token;

      if (!shortLivedToken) {
        throw new Error('No short-lived access_token in response');
      }

      const paramsLongLiveToken = {
        grant_type: 'fb_exchange_token',
        client_id: FACEBOOK_CONFIG.APP.ID,
        client_secret: FACEBOOK_CONFIG.APP.SECRET,
        fb_exchange_token: shortLivedToken,
      };

      // 2. Gọi tiếp để lấy long-lived token
      const longTokenResp = await this.facebookHttpService.callFacebookAPI(
        endpoint,
        HttpMethod.GET,
        paramsLongLiveToken,
        undefined,
        FACEBOOK_CONFIG.BASE_PATH_FACEBOOK,
      );

      const longLivedToken = longTokenResp.data.access_token;

      if (!longLivedToken) {
        throw new Error('No long-lived access_token in response');
      }

      return longLivedToken;
    } catch (error) {
      throw new Error(
        `Failed to exchange code for token: ${error.message || error}`,
      );
    }
  }

  private async getTokenPages(tokenUser: string): Promise<TPageInfo[]> {
    const endpoint = `me/accounts`;

    const params = {
      access_token: tokenUser,
      fields: 'id,name,access_token,picture{url},tasks',
    };

    try {
      const resp = await this.facebookHttpService.callFacebookAPI(
        endpoint,
        HttpMethod.GET,
        params,
        undefined,
        FACEBOOK_CONFIG.BASE_PATH_FACEBOOK,
      );

      return resp.data.data;
    } catch (error) {
      throw new Error(`Failed to get pages: ${error.message || error}`);
    }
  }

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (
      mode === this.hubMode &&
      token === process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN
    ) {
      return challenge;
    } else {
      throw new Error('Invalid verification token or mode');
    }
  }

  async handleWebhook(body: FacebookWebhookDTO): Promise<void> {
    if (body.object !== 'page') {
      throw new Error('IGNORED');
    }

    for (const entry of body.entry ?? []) {
      for (const event of entry.messaging) {
        if (event.message?.attachments?.length) {
          this.producer.send({
            topic: this.topic,
            messages: [
              {
                key: event.sender.id,
                value: JSON.stringify(event),
              },
            ],
          });
          continue;
        }

        if (event.message?.text) {
          this.producer.send({
            topic: this.topic,
            messages: [
              {
                key: event.sender.id,
                value: JSON.stringify(event),
              },
            ],
          });
        }
      }
    }
  }

  async sendMessageFacebook(
    access_token: string,
    customerId: string,
    message: string,
    pageId: string,
  ): Promise<AxiosResponse> {
    const endpoint = `${pageId}/messages?access_token=${access_token}`;
    const data = {
      recipient: {
        id: customerId,
      },
      message: {
        text: message,
      },
      tag: 'ACCOUNT_UPDATE',
    };
    const response = await this.facebookHttpService.callFacebookAPI(
      endpoint,
      HttpMethod.POST,
      data,
      undefined,
      FACEBOOK_CONFIG.BASE_PATH_FACEBOOK,
    );

    return response;
  }

  async getUserProfile(
    query: FacebookUserProfileQueryDTO,
  ): Promise<TUserProfile> {
    const { access_token, fields, psid } = query;
    const endpoint = psid;
    const params = {
      access_token: access_token,
      fields: fields,
    };

    try {
      const response = await this.facebookHttpService.callFacebookAPI(
        endpoint,
        HttpMethod.GET,
        params,
        undefined,
        FACEBOOK_CONFIG.BASE_PATH_FACEBOOK,
      );

      if (!response.data) {
        throw new Error('User not exist');
      }

      return response.data;
    } catch (error) {
      throw new Error(`${error.message || error}`);
    }
  }

  async fetchConversationFromFacebook(
    pageId: string,
    accessTokenPage: string,
    afterCursor?: string,
  ): Promise<AxiosResponse> {
    const endpoint = `${pageId}/conversations`;
    const params: Record<string, any> = {
      fields: `id,updated_time`,
      access_token: accessTokenPage,
    };
    if (afterCursor) params.after = afterCursor;

    return this.facebookHttpService.callFacebookAPI(
      endpoint,
      HttpMethod.GET,
      params,
      undefined,
      FACEBOOK_CONFIG.BASE_PATH_FACEBOOK,
    );
  }

  // Lấy avatar user từ Facebook (nếu lỗi thì trả null)
  async getFacebookAvatar(
    psid: string,
    accessToken: string,
  ): Promise<string | null> {
    try {
      // Gọi API Graph Facebook để lấy profile_pic
      const url = `https://graph.facebook.com/${psid}?fields=profile_pic&access_token=${accessToken}`;
      const resp = await axios.get(url);
      return resp.data?.profile_pic || null;
    } catch {
      return null;
    }
  }

  async fetchAllMessagesOfConversation(
    conversationId: string,
    accessToken: string,
    limit: number,
  ) {
    let afterCursor: string | undefined = undefined;
    const allMessages = [];

    while (true) {
      const endpoint = `${conversationId}/messages`;
      const params: Record<string, any> = {
        fields: 'id,message,created_time,from,attachments',
        access_token: accessToken,
        limit: limit,
      };
      if (afterCursor) params.after = afterCursor;

      const response = await this.facebookHttpService.callFacebookAPI(
        endpoint,
        HttpMethod.GET,
        params,
        undefined,
        FACEBOOK_CONFIG.BASE_PATH_FACEBOOK,
      );

      const messages = response.data.data;
      if (!messages || messages.length === 0) break;

      allMessages.push(...messages);
      afterCursor = response.data.paging?.cursors?.after;
      if (!afterCursor) break;
    }

    return allMessages;
  }

  async syncFacebookMesssageConversation(
    pageId: string,
    conversationId: string,
  ) {
    try {
      const facebookChannel = await this.channelService.getByTypeAndAppId(
        ChannelType.FACEBOOK,
        pageId,
      );

      const accessToken = facebookChannel.accessToken;

      const messages = await this.fetchAllMessagesOfConversation(
        conversationId,
        accessToken,
        100,
      );

      for (const msg of messages) {
        const isFromUser = msg.from.id !== pageId;

        const customer = await this.customerService.upsertUser({
          platform: ChannelType.FACEBOOK,
          externalId: isFromUser ? msg.from.id : pageId,
          name: isFromUser ? msg.from.name : facebookChannel.name,
          channelId: facebookChannel.id,
          shopId: facebookChannel.shop.id,
        });

        const externalConversation = {
          id: conversationId,
          timestamp: new Date(msg.created_time),
        };

        const message = await this.handleTransferMessage(msg);

        if (isFromUser) {
          await this.conversationService.handleUserMessage({
            channel: facebookChannel,
            customer: customer,
            message: message,
            externalConversation,
          });
        } else {
          await this.conversationService.handleChannelMessage({
            channel: facebookChannel,
            message: message,
            customer: customer,
            externalConversation,
          });
        }
      }
    } catch (error) {
      throw new Error(`Failed to sync conversations: ${error.message}`);
    }
  }

  async handleTransferMessage(message) {
    if (!message.attachments) {
      return {
        id: message.id,
        content: message.message || '',
        contentType: MessageType.TEXT,
        createdAt: new Date(message.created_time),
      };
    }

    const links = message.attachments.data.map((attachment) => {
      return attachment.image_data.preview_url;
    });

    return {
      id: message.id,
      content: message.message || '',
      contentType: MessageType.IMAGE,
      createdAt: new Date(message.created_time),
      links,
    };
  }

  async syncConversationWithinCustomTimeFacebook(
    pageId: string,
    within: number,
    type: dayjs.ManipulateType,
  ) {
    const facebookChannel = await this.channelService.getByTypeAndAppId(
      ChannelType.FACEBOOK,
      pageId,
    );
    if (!facebookChannel?.accessToken)
      throw new Error('No access token found.');

    let afterCursor: string | undefined = undefined;
    const processedMessagesFacebook = [];
    const accessToken = facebookChannel.accessToken;

    while (true) {
      const response = await this.fetchConversationFromFacebook(
        pageId,
        accessToken,
        afterCursor,
      );
      if (!response || !response.data.data || response.data.data.length === 0)
        break;

      const conversations = response.data.data;
      let shouldBreak = false;

      for (let i = 0; i < conversations.length; i++) {
        const conversation = conversations[i];
        const ms = new Date(conversation.updated_time).getTime();
        const isWithinCustomTime = isAfter(ms, within, type, true);

        if (!isWithinCustomTime) {
          shouldBreak = true;
          break;
        }

        processedMessagesFacebook.push({
          name: 'sync-facebook-conversations',
          data: {
            pageId: pageId,
            conversationId: conversation.id,
          },
          opts: {
            jobId: `sync-facebook-conversations-${conversation.id}`,
            removeOnComplete: true,
            removeOnFail: true,
            delay: i * 1000,
          },
        });
      }

      if (shouldBreak) {
        break;
      }
      afterCursor = response.data.paging?.cursors?.after;
    }

    await this.facebookSyncQueue.addBulk(processedMessagesFacebook);

    return processedMessagesFacebook;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleTokenExpiryCheck() {
    const fbChannels = await this.channelService.findByType(
      ChannelType.FACEBOOK,
    );

    for (const channel of fbChannels) {
      const { id: channelId, accessToken } = channel;
      try {
        const isNearExpiry = await this.facebookTokenService.isTokenNearExpiry(
          accessToken,
          channelId,
        );

        if (isNearExpiry) {
          const newToken =
            await this.facebookTokenService.refreshLongLivedToken(accessToken);

          await this.channelService.update(channelId, {
            accessToken: newToken,
          });
        }
      } catch (err) {
        throw new Error(`Error checking token expiry: ${err.message || err}`);
      }
    }

    return {
      messages: 'Facebook page tokens expiry check finished.',
    };
  }
}
