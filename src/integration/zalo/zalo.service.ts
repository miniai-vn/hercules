import { InjectQueue } from '@nestjs/bullmq';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Queue } from 'bullmq';
import dayjs from 'dayjs';
import * as dotenv from 'dotenv';
import { Producer } from 'kafkajs';
import { Channel } from 'src/channels/channels.entity';
import { ChannelsService } from 'src/channels/channels.service';
import { ChannelType } from 'src/channels/dto/channel.dto';
import { HttpMethod } from 'src/common/enums/http-method.enum';
import { delay, isAfter } from 'src/common/utils/utils';
import { ConversationsService } from 'src/conversations/conversations.service';
import { Platform } from 'src/customers/customers.dto';
import { CustomersService } from 'src/customers/customers.service';
import { KafkaProducerService } from 'src/kafka/kafka.producer';
import { ZALO_CONFIG } from './config/zalo.config';
import { ZaloIntegrateWebhookDto } from './dto/zalo-webhook.dto';

dotenv.config();

@Injectable()
export class ZaloService {
  private readonly topic = process.env.KAFKA_ZALO_MESSAGE_TOPIC;
  producer: Producer;
  constructor(
    @Inject(forwardRef(() => ChannelsService))
    private readonly channelService: ChannelsService,
    private readonly kafkaProducerService: KafkaProducerService,
    private readonly customerService: CustomersService,
    private readonly conversationService: ConversationsService,
    @InjectQueue(process.env.REDIS_ZALO_SYNC_TOPIC)
    private readonly zaloSyncQueue: Queue,
  ) {
    this.producer = this.kafkaProducerService.getProducer();
  }

  /**
   * Common method to handle Zalo API calls
   */
  private async callZaloAPI({
    endpoint,
    method = 'POST',
    data,
    headers = {},
    baseUrl = ZALO_CONFIG.BASE_URL,
    params,
  }: {
    endpoint: string;
    method: 'GET' | 'POST';
    data?: any;
    headers?: Record<string, string>;
    baseUrl?: string;
    params?: any;
  }): Promise<AxiosResponse> {
    try {
      const config: AxiosRequestConfig = {
        method,
        url: `${baseUrl}${endpoint}`,
        headers: {
          ...headers,
        },
      };

      if (method === 'POST' && data) {
        config.data = data;
      } else if (method === 'GET' && data) {
        config.data = data;
      } else if (params && method === 'GET') {
        config.params = params;
      }

      return await axios(config);
    } catch (error) {
      throw new Error(`Zalo API call failed: ${error.message}`);
    }
  }

  /**
   * Common method for OAuth API calls
   */
  private async callZaloOAuthAPI(
    endpoint: string,
    data: any,
  ): Promise<AxiosResponse> {
    const headers = {
      secret_key: process.env.ZALO_APP_SECRET,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    return this.callZaloAPI({
      endpoint,
      method: 'POST',
      data,
      headers,
      baseUrl: ZALO_CONFIG.OAUTH_BASE_URL,
    });
  }

  /**
   * Common method for API calls with access token
   */
  private async callZaloAuthenticatedAPI(
    endpoint: string,
    accessToken: string,
    method: 'GET' | 'POST' = 'GET',
    data?: any,
    params?: any,
  ): Promise<AxiosResponse> {
    const headers = {
      access_token: accessToken,
    };

    return this.callZaloAPI({ endpoint, method, data, headers, params });
  }

  /**
   * Get access token from Zalo using authorization code
   */
  async getAccessToken(oa_id: string, code: string) {
    try {
      const requestData = {
        code,
        app_id: process.env.ZALO_APP_ID,
        grant_type: 'authorization_code',
      };

      const response = await this.callZaloOAuthAPI(
        ZALO_CONFIG.OAUTH_ENDPOINTS.ACCESS_TOKEN,
        requestData,
      );

      const infoOa = await this.callZaloAuthenticatedAPI(
        ZALO_CONFIG.ENDPOINTS.GET_OA_INFO,
        response.data.access_token,
      );
      const expiresInSeconds = response.data.expires_in;
      const expireTokenTime = new Date(Date.now() + expiresInSeconds * 1000);

      const channel = await this.channelService.getByTypeAndAppId(
        ChannelType.ZALO,
        infoOa.data.data.oa_id,
      );
      if (channel) {
        await this.channelService.update(channel.id, {
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
          expireTokenTime: expireTokenTime,
        });
      } else {
        await this.channelService.create({
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
          appId: infoOa.data.data.oa_id,
          avatar: infoOa.data.data.avatar,
          name: infoOa.data.data.name,
          type: ChannelType.ZALO,
          expireTokenTime: expireTokenTime,
        });
      }

      return `${process.env.DASHBOARD_BASE_URL}/dashboard/channels?type=zalo&appId=${infoOa.data.data.oa_id}`;
    } catch (error) {
      throw error;
    }
  }
  /**
   * Refresh access token for Zalo channel
   */
  async refreshAccessToken(channel: Channel): Promise<boolean> {
    try {
      const requestData = {
        refresh_token: channel.refreshToken,
        app_id: process.env.ZALO_APP_ID,
        grant_type: 'refresh_token',
      };

      const response = await this.callZaloOAuthAPI(
        ZALO_CONFIG.OAUTH_ENDPOINTS.ACCESS_TOKEN,
        requestData,
      );

      if (response.data.access_token) {
        const expiresInSeconds = response.data.expires_in;
        const expireTokenTime = new Date(Date.now() + expiresInSeconds * 1000);

        await this.channelService.update(channel.id, {
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token || channel.refreshToken,
          expireTokenTime: expireTokenTime,
        });

        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Send message to Zalo user
   */
  async sendMessage(
    accessToken: string,
    message: string,
    zaloId: string,
  ): Promise<AxiosResponse> {
    const data = {
      recipient: {
        user_id: zaloId,
      },
      message: {
        text: message,
      },
    };
    return this.callZaloAuthenticatedAPI(
      ZALO_CONFIG.ENDPOINTS.SEND_MESSAGE,
      accessToken,
      HttpMethod.POST,
      data,
    );
  }

  /**
   * Get user profile from Zalo
   */
  async getUserProfile(
    accessToken: string,
    userId: string,
  ): Promise<AxiosResponse> {
    return this.callZaloAuthenticatedAPI(
      ZALO_CONFIG.ENDPOINTS.GET_USER_PROFILE,
      accessToken,
      HttpMethod.GET,
      undefined,
      { data: JSON.stringify({ user_id: userId }) },
    );
  }

  async fetchConversaitons({
    accessToken,
    offset = 0,
    count = 10,
    userId,
  }: {
    accessToken: string;
    offset?: number;
    count?: number;
    userId?: string;
  }): Promise<AxiosResponse> {
    return this.callZaloAuthenticatedAPI(
      ZALO_CONFIG.ENDPOINTS.GET_CONVERSATIONS,
      accessToken,
      HttpMethod.GET,
      undefined,
      { data: JSON.stringify({ offset, count, user_id: userId }) },
    );
  }

  async handleSyncConversationsWithUserId(
    user_id: string,
    appId: string,
    messageCount: number = 30,
  ) {
    try {
      const channel = await this.channelService.getByTypeAndAppId(
        ChannelType.ZALO,
        appId,
      );
      let offset = 0;
      const count = 10;

      while (true) {
        const response = await this.fetchConversaitons({
          accessToken: channel.accessToken,
          offset,
          count,
          userId: user_id,
        });

        if (
          !response.data ||
          !response.data.data ||
          response.data.data.length === 0 ||
          response.data.data.total <= offset
        ) {
          break;
        }

        for (const message of response.data.data) {
          const isFromUser = message.src === 1;

          const customer = await this.customerService.findOrCreateByExternalId({
            platform: Platform.ZALO,
            externalId: isFromUser ? message.from_id : message.to_id,
            name: isFromUser
              ? message.from_display_name
              : message.to_display_name,
            avatar: isFromUser ? message.from_avatar : message.to_avatar,
            channelId: channel.id,
          });

          if (isFromUser) {
            await this.conversationService.handerUserMessage({
              channel: channel,
              customer: customer,
              message: {
                content: message.message,
                type: message.type,
                id: message.message_id,
                links: message.links,
                thumb: message.thumb,
                url: message.url,
              },
              externalConversation: {
                id: customer.externalId,
                timestamp: new Date(message.time),
              },
            });
          } else {
            await this.conversationService.sendMessageToConversationWithOthers({
              channel: channel,
              message: {
                content: message.message,
                type: message.type,
                id: message.message_id,
              },
              customer: customer,
              externalConversation: {
                id: customer.externalId,
                timestamp: new Date(),
              },
            });
          }
        }
        if (messageCount && count >= messageCount) {
          break;
        }
        offset += count;
      }
    } catch (error) {
      throw new Error(
        `Failed to sync conversations with user ID ${user_id}: ${error.message}`,
      );
    }
  }
  async getUsers({
    accessToken,
    offset = 0,
    count = 100,
  }: {
    accessToken: string;
    offset?: number;
    count?: number;
  }) {
    return await this.callZaloAPI({
      endpoint: ZALO_CONFIG.ENDPOINTS.GET_USER_LIST,
      method: HttpMethod.GET,
      headers: {
        access_token: accessToken,
      },
      data: {
        offset,
        count,
      },
      baseUrl: ZALO_CONFIG.BASE_URL,
    });
  }

  async getAllUsers(appId: string) {
    const channel = await this.channelService.getByTypeAndAppId(
      ChannelType.ZALO,
      appId,
    );
    let offset = 0;
    const count = 50;
    const allUsers = [];

    while (true) {
      const response = await this.getUsers({
        accessToken: channel.accessToken,
        offset,
        count,
      });

      if (
        !response.data ||
        !response.data.data ||
        response.data.data.length === 0 ||
        response.data.data.total <= offset
      ) {
        break;
      }

      allUsers.push(...response.data.data.users);
      offset += count;
    }
    for (let i = 0; i <= allUsers.length; i++) {
      const profileResponse = await this.getUserProfile(
        channel.accessToken,
        allUsers[i]?.user_id,
      );
      allUsers[i].profile = profileResponse.data.data || {};
      await this.customerService.upsert({
        platform: Platform.ZALO,
        externalId: allUsers[i].user_id,
        name: allUsers[i].profile.display_name || '',
        shopId: channel?.shop?.id || null,
        channelId: channel?.id || null,
        avatar: allUsers[i].profile.avatar || '',
      });
      delay(Math.random() * 1000);
    }
    return allUsers;
  }

  async getUser({
    accessToken,
    offset,
    count,
  }: {
    accessToken: string;
    offset?: number;
    count?: number;
  }) {
    return await this.callZaloAPI({
      endpoint: ZALO_CONFIG.ENDPOINTS.GET_USER_LIST,
      method: HttpMethod.GET,
      headers: {
        access_token: accessToken,
      },
      data: {
        offset,
        count,
      },
      baseUrl: ZALO_CONFIG.BASE_URL,
    });
  }

  private needsTokenRefresh(channel: Channel): boolean {
    if (!channel.expireTokenTime) {
      return false;
    }
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    return channel.expireTokenTime <= twoHoursFromNow;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkAndRefreshTokens(): Promise<void> {
    try {
      const zaloChannels = await this.channelService.findByType(
        ChannelType.ZALO,
      );
      if (!zaloChannels || zaloChannels.length === 0) {
        return;
      }

      for (const channel of zaloChannels) {
        if (this.needsTokenRefresh(channel)) {
          await this.refreshAccessToken(channel);
        }
      }
    } catch (error) {
      // Silent fail
    }
  }

  async manualTokenRefresh(
    appId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const channel = await this.channelService.getByTypeAndAppId(
        ChannelType.ZALO,
        appId,
      );

      const success = await this.refreshAccessToken(channel);

      return {
        success,
        message: success
          ? 'Token refreshed successfully'
          : 'Failed to refresh token',
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async handleWebhook(payload: ZaloIntegrateWebhookDto): Promise<void> {
    try {
      switch (payload.event_name) {
        case ZALO_CONFIG.WEBHOOK_EVENTS.USER_SEND_TEXT:
          await this.handleProducerMessage(payload);
          break;

        case ZALO_CONFIG.WEBHOOK_EVENTS.OA_SEND_TEXT:
          await this.handleProducerMessage(payload);
          break;

        // case ZALO_CONFIG.WEBHOOK_EVENTS.USER_SEEN_MESSAGE:
        //   await this.handleProducerMessage(payload);

        default:
          // Silent ignore
          break;
      }
    } catch (error) {
      throw error;
    }
  }

  private async handleProducerMessage(
    payload: ZaloIntegrateWebhookDto,
  ): Promise<void> {
    this.producer.send({
      topic: this.topic,
      messages: [
        {
          key: new Date().toISOString(),
          value: JSON.stringify(payload),
        },
      ],
    });
  }

  /**
   * Fetch recent chat messages
   */
  async fetchRecentChat({
    accessToken,
    offset = 0,
    count = 10,
  }: {
    accessToken: string;
    offset?: number;
    count?: number;
  }): Promise<AxiosResponse> {
    return this.callZaloAuthenticatedAPI(
      ZALO_CONFIG.ENDPOINTS.LIST_RECENT_CHAT,
      accessToken,
      HttpMethod.GET,
      undefined,
      { data: JSON.stringify({ offset, count }) },
    );
  }

  /**
   * Fetch conversations within the last month
   */
  async fetchMessagesWithinCustomTime(
    appId: string,
    within: number,
    type: dayjs.ManipulateType,
    messageCount: number | null = 30,
  ) {
    const channel = await this.channelService.getByTypeAndAppId(
      ChannelType.ZALO,
      appId,
    );
    let offset = 0;
    let count = 10;
    const processedMessages = [];

    while (true) {
      const response = await this.fetchRecentChat({
        accessToken: channel.accessToken,
        offset,
        count,
      });

      if (
        !response.data ||
        !response.data.data ||
        response.data.data.length === 0
      ) {
        break;
      }

      const result = response.data.data;
      let shouldBreak = false;

      for (let i = 0; i < result.length; i++) {
        const message = result[i];
        const isWithinCustomTime = isAfter(message.time, within, type, true);
        if (!isWithinCustomTime) {
          shouldBreak = true;
          break;
        }

        const userId = message.src === 1 ? message.from_id : message.to_id;

        processedMessages.push({
          name: 'sync-zalo-conversations-with-user',
          data: {
            userId: userId,
            appId: appId,
            messageCount,
          },
          opts: {
            jobId: `${appId}-${userId}`,
            removeOnComplete: true,
            removeOnFail: true,
          },
        });
      }

      if (shouldBreak) {
        break;
      }

      offset += 1;
    }

    await this.zaloSyncQueue.addBulk(processedMessages);
    return processedMessages;
  }
}
