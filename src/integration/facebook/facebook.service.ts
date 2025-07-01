import { FacebookHttpService } from './facebook-http.service';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { FACEBOOK_CONFIG } from './config/facebook.config';
import { ChannelsService } from 'src/channels/channels.service';
import { ChannelType } from 'src/channels/dto/channel.dto';
import { TPageInfo } from './types/page.type';
import { FacebookTokenService } from './facebook-token.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FacebookUserProfileQueryDTO } from './dto/facebook.dto';
import { FacebookWebhookDTO } from './dto/facebook-webhook.dto';
import { TUserProfile } from './types/user.type';
import { ChatService } from 'src/chat/chat.service';
import { HttpMethod } from 'src/common/enums/http-method.enum';
import {
  TConversationResponse,
  TFacebookConversation,
  TFacebookConversationResponse,
} from './types/conversation.type';
import { ConversationsService } from 'src/conversations/conversations.service';
import { CustomersService } from 'src/customers/customers.service';
import { Platform } from 'src/customers/customers.dto';
import { TFacebookMessage } from './types/message.type';
import { Customer } from 'src/customers/customers.entity';
dotenv.config();
Injectable();
export class FacebookService {
  private readonly hubMode = 'subscribe';
  constructor(
    private readonly channelService: ChannelsService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    private readonly facebookHttpService: FacebookHttpService,
    private readonly facebookTokenService: FacebookTokenService,
    private readonly conversationService: ConversationsService,
    private readonly customerService: CustomersService,
  ) {}

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
        if (event.message?.text) {
          await this.chatService.sendMessagesFacebookToPlatform(event);
        }
      }
    }
  }

  async sendMessageFacebook(
    access_token: string,
    customerId: string,
    message: string,
  ): Promise<AxiosResponse> {
    const endpoint = `me/messages?access_token=${access_token}`;
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
    limit: 10,
    afterCursor?: string,
  ): Promise<AxiosResponse> {
    const endpoint = `${pageId}/conversations`;
    const params: Record<string, any> = {
      fields: `id,senders,snippet,updated_time,messages.limit(1){id,message,created_time,from,attachments}`,
      access_token: accessTokenPage,
      limit,
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

  async syncFacebookConversation(pageId: string) {
    const allConversations: TFacebookConversation[] = [];
    try {
      const facebookChannel = await this.channelService.getByTypeAndAppId(
        ChannelType.FACEBOOK,
        pageId,
      );

      if (!facebookChannel?.accessToken)
        throw new Error('No access token found.');

      const accessToken = facebookChannel.accessToken;
      let afterCursor: string | undefined = undefined;

      while (true) {
        const response = await this.fetchConversationFromFacebook(
          pageId,
          accessToken,
          10,
          afterCursor,
        );

        const conversations = response.data.data;
        if (!conversations || conversations.length === 0) break;

        for (const conv of conversations) {
          const user = conv.senders.data.find((u) => u.id !== pageId);

          for (const message of conv.messages.data) {
            let customer: Customer;
            if (user) {
              if (!customer) {
                customer = await this.customerService.findByExternalId(
                  Platform.FACEBOOK,
                  user.id,
                );

                const query = {
                  access_token: facebookChannel.accessToken,
                  fields: 'first_name,last_name,profile_pic,name',
                  psid: message.from.id,
                };

                let resp: any;
                try {
                  resp = await this.getUserProfile(query);
                } catch (error) {
                  resp = null;
                }

                customer = await this.customerService.findOrCreateByExternalId({
                  platform: Platform.FACEBOOK,
                  externalId: message.from.id,
                  name: message.from.name,
                  avatar: resp?.profile_pic || null,
                  channelId: facebookChannel.id,
                  shopId: facebookChannel.shop.id,
                });
              }

              try {
                await this.conversationService.sendMessageToConversation({
                  externalMessageId: message.id,
                  channel: facebookChannel,
                  customer: customer,
                  message: message.message,
                  type: 'text',
                });
              } catch (error) {
                continue;
              }
            } else {
              await this.conversationService.sendMessageToConversationWithOthers(
                {
                  channel: facebookChannel,
                  message,
                  customer: customer,
                },
              );
            }
          }
        }
        allConversations.push(...conversations);

        afterCursor = response.data.paging?.cursors?.after;
        if (!afterCursor) break;
      }

      return { success: true, conversations: allConversations };
    } catch (error) {
      throw new Error(`Failed to sync conversations: ${error.message}`);
    }
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
