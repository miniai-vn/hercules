import { Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';
import { Channel } from 'src/channels/channels.entity';
import { ChannelsService } from 'src/channels/channels.service';
import { ChannelType } from 'src/channels/dto/channel.dto';
import { HttpMethod } from 'src/common/enum';
import { KafkaService } from 'src/kafka/kafka.service';
import { ZALO_CONFIG } from './config/zalo.config';
import { ZaloWebhookDto } from './dto/zalo-webhook.dto';

dotenv.config();

@Injectable()
export class ZaloService {
  private readonly topic = process.env.KAFKA_ZALO_MESSAGE_TOPIC;

  constructor(
    private readonly channelService: ChannelsService,
    private readonly kafkaService: KafkaService,
  ) {}

  /**
   * Common method to handle Zalo API calls
   */
  private async callZaloAPI(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    data?: any,
    headers?: Record<string, string>,
    baseUrl: string = ZALO_CONFIG.BASE_URL,
  ): Promise<AxiosResponse> {
    try {
      const config: AxiosRequestConfig = {
        method,
        url: `${baseUrl}${endpoint}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...headers,
        },
      };

      if (data) {
        config.data = data;
      } else if (method === HttpMethod.GET && data) {
        config.params = data;
      }

      return await axios({
        method: config.method,
        url: config.url,
        headers: config.headers,
        data: config.data,
      });
    } catch (error) {
      console.error(`Zalo API call failed: ${error.message}`);
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
    };

    return this.callZaloAPI(
      endpoint,
      'POST',
      data,
      headers,
      ZALO_CONFIG.OAUTH_BASE_URL,
    );
  }

  /**
   * Common method for API calls with access token
   */
  private async callZaloAuthenticatedAPI(
    endpoint: string,
    accessToken: string,
    method: 'GET' | 'POST' = 'GET',
    data?: any,
  ): Promise<AxiosResponse> {
    const headers = {
      access_token: accessToken,
    };

    return this.callZaloAPI(endpoint, method, data, headers);
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
    messageData: any,
  ): Promise<AxiosResponse> {
    return this.callZaloAuthenticatedAPI(
      ZALO_CONFIG.ENDPOINTS.SEND_MESSAGE,
      accessToken,
      HttpMethod.POST,
      messageData,
    );
  }

  /**
   * Get user profile from Zalo
   */
  async getListUser({
    offset,
    count,
    accessToken,
  }: {
    offset: string;
    count: string;
    accessToken: string;
  }): Promise<AxiosResponse> {
    const body = {
      offset,
      count,
    };

    return this.callZaloAuthenticatedAPI(
      ZALO_CONFIG.ENDPOINTS.GET_USER_LIST,
      accessToken,
      HttpMethod.GET,
      JSON.stringify(body),
    );
  }

  async getUserProfile({
    accessToken,
    userId,
  }: {
    accessToken: string;
    userId: string;
  }): Promise<AxiosResponse> {
    const params = {
      data: JSON.stringify({
        user_id: userId,
      }),
    };

    return this.callZaloAuthenticatedAPI(
      ZALO_CONFIG.ENDPOINTS.GET_USER_INFO,
      accessToken,
      'GET',
      params,
    );
  }

  async getConversations(
    accessToken: string,
    params?: any,
  ): Promise<AxiosResponse> {
    return this.callZaloAuthenticatedAPI(
      ZALO_CONFIG.ENDPOINTS.GET_CONVERSATIONS,
      accessToken,
      'GET',
      params,
    );
  }

  needsTokenRefresh(channel: Channel): boolean {
    if (!channel.expireTokenTime) {
      return false;
    }
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    return channel.expireTokenTime <= twoHoursFromNow;
  }

  async manualTokenRefresh(
    channelId: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const channel = await this.channelService.findOne(channelId);

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

  async getUserListAndPublishToKafka({
    channel,
    lastOffset = '0',
    count = '50',
  }: {
    channel?: Channel;
    lastOffset: string;
    count: string;
  }) {
    try {
      let total = 50;
      let nextOffset = Number(lastOffset);

      if (nextOffset < total) {
        const response = await this.getListUser({
          accessToken: channel.accessToken,
          offset: lastOffset,
          count: count,
        });
        total =
          response?.data?.data.total == total ? response?.data?.data.total : 0;
        const customers = response?.data?.data.users || [];

        // Delay to avoid hitting rate limits
        if (customers.length > 0) {
          await this.kafkaService.emitBatchMessages(
            this.topic,
            customers.map((customer) => ({
              key: customer.user_id,
              value: JSON.stringify({
                ...customer,
                channelId: channel?.id || null,
              }),
            })),
          );
        }
      }

      return {
        offset: nextOffset,
        total,
        success: true,
        message: 'User list fetched and published to Kafka successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle text message from Zalo webhook
   */
  private async handleTextMessage(payload: ZaloWebhookDto): Promise<void> {
    this.kafkaService.emitMessage(this.topic, payload);
  }
}
