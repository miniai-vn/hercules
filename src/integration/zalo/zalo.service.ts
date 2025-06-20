import { Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';
import { ChannelsService } from 'src/channels/channels.service';
import { ChannelType } from 'src/channels/dto/channel.dto';
import { ZALO_CONFIG } from './config/zalo.config';
import { ZaloWebhookDto } from './dto/zalo-webhook.dto';
import { KafkaService } from 'src/kafka/kafka.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Channel } from 'src/channels/channels.entity';
import { HttpMethod } from 'src/common/enums/http-method.enum';

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
        config.params = data;
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
  ): Promise<AxiosResponse> {
    const headers = {
      access_token: accessToken,
    };

    return this.callZaloAPI({ endpoint, method, data, headers });
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
      { data: JSON.stringify({ user_id: userId }) },
    );
  }

  async getConversations(
    accessToken: string,
    params?: any,
  ): Promise<AxiosResponse> {
    return;
  }

  async getUserList({
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
}
