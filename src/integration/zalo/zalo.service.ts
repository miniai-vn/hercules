import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';
import { Channel } from 'src/channels/channels.entity';
import { ChannelsService } from 'src/channels/channels.service';
import { ChannelType } from 'src/channels/dto/channel.dto';
import { HttpMethod } from 'src/common/enums/http-method.enum';
import { KafkaService } from 'src/kafka/kafka.service';
import { ZALO_CONFIG } from './config/zalo.config';
import { ZaloWebhookDto } from './dto/zalo-webhook.dto';
import { CustomersService } from 'src/customers/customers.service';
import { ConversationsService } from 'src/conversations/conversations.service';
import { Platform } from 'src/customers/customers.dto';
import { delay } from 'src/common/utils/utils';
import { ConversationType } from 'src/conversations/conversations.entity';

dotenv.config();

@Injectable()
export class ZaloService {
  private readonly topic = process.env.KAFKA_ZALO_MESSAGE_TOPIC;

  constructor(
    @Inject(forwardRef(() => ChannelsService))
    private readonly channelService: ChannelsService,
    private readonly kafkaService: KafkaService,
    private readonly customerService: CustomersService,
    private readonly conversationService: ConversationsService, // Assuming this is the correct service for conversations
  ) {}

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

  async refreshAccessToken(channel: Channel): Promise<boolean> {
    try {
      const requestData = {
        refresh_token: channel.refreshToken,
        app_id: process.env.ZALO_APP_ID,
        grant_type: 'refresh_token',
      };

      // Use common OAuth API method
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
    customerId: string,
  ): Promise<AxiosResponse> {
    const data = {
      recipient: {
        user_id: customerId,
      },
      message: message,
    };
    return this.callZaloAuthenticatedAPI(
      ZALO_CONFIG.ENDPOINTS.SEND_MESSAGE,
      accessToken,
      HttpMethod.POST,
      JSON.stringify(data),
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

  async handleFetchConversation(accessToken: string = '', userId: string) {
    let offset = 0;
    const count = 10;
    const allConversations = [];

    while (true) {
      const response = await this.fetchConversaitons({
        accessToken,
        offset,
        count,
        userId,
      });
      console.log('Fetched conversations:', response.data);

      if (
        !response.data ||
        !response.data.data ||
        response.data.data.length === 0
      ) {
        break;
      }

      allConversations.push(...response.data.data);
      offset += count;
    }
    console.log('All conversations fetched:', allConversations);
    return allConversations;
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

  async getAllUsers(
    accessToken: string = 'F8MQBDjf1YSyWPuiss448pwCcYZQUd9sPCgfSy1TPmaYneDaa3Dr4ohTcsQEVr8m6iogT_nELouOe8j3gmb9AIgMeKMG76KXS9t_LiWs8pHViRnlpX1QObgGsnpj9XbeNRV_FT4A9t5_cyXwpmeLBd6xxohI91CcGeN88lK8FKPIlA4zmXHKRJcUoHchTXDI8kEDFfKM4tC2jDGqWoKIG6pFzaJuU2eBHl6-HV5nT1DXX9nRsJy40dUsqMkO8WrY98kMPhzWOsfQsuWwwKP6IL3FlZ3sRbv44kJ7FFrI3Lv6s_SLqs0-S3RDuHsBH3XH7j_n2PrKFmPu_-fKrsmXM6ADt366OqOw4V7POhLV40u9x8XAY7DTEX-UbNVu8LehLhoZSD5LE0fT-SP2l54I45ZG_sn3KTROh3tUSmSf',
  ) {
    let offset = 0;
    const count = 50;
    const allUsers = [];

    while (true) {
      const response = await this.getUsers({
        accessToken,
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
    for (let i = 0; i < 19; i++) {
      const profileResponse = await this.getUserProfile(
        accessToken,
        allUsers[i].user_id,
      );
      allUsers[i].profile = profileResponse.data.data || {};
      delay(Math.random() * 1000); // Delay to avoid hitting rate limits
    }
    return allUsers.slice(0, 20); // Return only the first 20 users
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
    channelId: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const channel = await this.channelService.getOne(channelId);

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

  async handleWebhook(payload: ZaloWebhookDto): Promise<void> {
    try {
      switch (payload.event_name) {
        case ZALO_CONFIG.WEBHOOK_EVENTS.USER_SEND_TEXT:
          await this.handleTextMessage(payload);
          break;

        default:
          // Silent ignore
          break;
      }
    } catch (error) {
      throw error;
    }
  }

  private async handleTextMessage(payload: ZaloWebhookDto): Promise<void> {
    this.kafkaService.sendMessage(this.topic, payload);
  }

  async syncConversations(channelId: number) {
    const channel = await this.channelService.getOne(channelId);
    if (!channel) {
      throw new Error('Channel not found');
    }
    const customers = await this.getAllUsers(channel.accessToken);
    for (let i = 0; i < customers.length; i += 200) {
      const batch = customers.slice(i, i + 200);
      await this.customerService.createMany(
        batch.map((customer) => ({
          platform: Platform.ZALO,
          externalId: customer.user_id,
          name: customer.profile?.display_name || '',
          shopId: channel.shop.id,
          channelId: channel.id,
          avatar: customer.profile?.avatar || '',
        })),
      );
    }

    const platFormCustomer = await this.customerService.query({
      channelId: channel.id,
      page: 1,
      limit: 20,
    });

    for (const customer of platFormCustomer.data) {
      let conversation =
        await this.conversationService.getConversationByChannelAndCustomer(
          channel.id,
          customer.externalId,
        );
      if (!conversation) {
        conversation = await this.conversationService.create(
          {
            customerParticipantIds: [customer.id],
            externalId: customer.externalId,
            name: customer.name,
            avatar: customer.avatar,
            type: ConversationType.DIRECT,
          },
          channel,
        );
      }

      const messages = await this.handleFetchConversation(
        channel.accessToken,
        customer.externalId,
      );

      console.log(
        `Fetched ${messages.length} messages for customer ${customer.externalId}`,
      );
    }
  }
}
