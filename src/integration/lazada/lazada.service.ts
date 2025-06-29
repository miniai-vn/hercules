import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as crypto from 'crypto';
import dayjs from 'dayjs';
import * as dotenv from 'dotenv';
import { Producer } from 'kafkajs';
import { ChannelsService } from 'src/channels/channels.service';
import { ChannelType } from 'src/channels/dto/channel.dto';
import { ConversationsService } from 'src/conversations/conversations.service';
import { CustomersService } from 'src/customers/customers.service';
import { KafkaProducerService } from 'src/kafka/kafka.producer';
import { LAZADA_CONFIG } from './config/lazada.config';
import {
  LazadaAuthDto,
  LazadaOrderDto,
  LazadaProductDto,
  LazadaWebhookDto,
} from './dto/lazada-webhook.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { HttpMethod } from 'src/common/enums/http-method.enum';

dotenv.config();

@Injectable()
export class LazadaService {
  private readonly topic = process.env.KAFKA_LAZADA_MESSAGE_TOPIC;
  producer: Producer;

  constructor(
    @Inject(forwardRef(() => ChannelsService))
    private readonly channelService: ChannelsService,
    private readonly kafkaProducerService: KafkaProducerService,
    private readonly customerService: CustomersService,
    private readonly conversationService: ConversationsService,
    @InjectQueue(process.env.REDIS_LAZADA_SYNC_TOPIC)
    private readonly lazadaSyncQueue: Queue,
  ) {
    this.producer = this.kafkaProducerService.getProducer();
  }

  /**
   * Common method to handle Lazada API calls
   */
  private async callLazadaAPI({
    endpoint,
    method = 'GET',
    data,
    headers = {},
    baseUrl = LAZADA_CONFIG.BASE_URL,
    params,
    appKey,
    appSecret,
    accessToken,
  }: {
    endpoint: string;
    method?: string;
    data?: any;
    headers?: Record<string, string>;
    baseUrl?: string;
    params?: Record<string, any>;
    appKey: string;
    appSecret: string;
    accessToken?: string;
  }): Promise<AxiosResponse> {
    try {
      // Generate Lazada API signature
      const timestamp = Date.now().toString();
      const signParams: Record<string, any> = {
        app_key: appKey,
        timestamp,
        sign_method: 'sha256',
        ...params,
      };

      if (accessToken) {
        signParams.access_token = accessToken;
      }

      const signature = this.generateSignature(endpoint, signParams, appSecret);
      signParams.sign = signature;

      const config: AxiosRequestConfig = {
        method: method as any,
        url: `${baseUrl}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        params: signParams,
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        config.data = data;
      }

      const response = await axios(config);
      return response;
    } catch (error) {
      console.error('Lazada API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Generate Lazada API signature
   */
  private generateSignature(
    endpoint: string,
    params: Record<string, any>,
    appSecret: string,
  ): string {
    // Sort parameters by key
    const sortedKeys = Object.keys(params).sort();
    const concatenated = sortedKeys
      .map((key) => `${key}${params[key]}`)
      .join('');

    const stringToSign = `${endpoint}${concatenated}`;

    return crypto
      .createHmac('sha256', appSecret)
      .update(stringToSign)
      .digest('hex')
      .toUpperCase();
  }

  /**
   * Get access token using authorization code
   */
  async getAccessToken(code: string, appKey: string, appSecret: string) {
    try {
      const response = await this.callLazadaAPI({
        endpoint: '/auth/token/create',
        method: 'POST',
        params: {
          code,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        baseUrl: LAZADA_CONFIG.AUTH_URL,
        appKey,
        appSecret,
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get Lazada access token: ${error.message}`);
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(
    refreshToken: string,
    appKey: string,
    appSecret: string,
  ) {
    try {
      const response = await this.callLazadaAPI({
        endpoint: '/auth/token/refresh',
        method: 'POST',
        params: {
          refresh_token: refreshToken,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        baseUrl: LAZADA_CONFIG.AUTH_URL,
        appKey,
        appSecret,
      });

      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to refresh Lazada access token: ${error.message}`,
      );
    }
  }

  /**
   * Handle incoming webhook from Lazada
   */
  async handleWebhook(webhookData: LazadaWebhookDto) {
    try {
      console.log('Received Lazada webhook:', webhookData);

      switch (webhookData.event) {
        case LAZADA_CONFIG.WEBHOOK_EVENTS.ORDER_CREATED:
        case LAZADA_CONFIG.WEBHOOK_EVENTS.ORDER_UPDATED:
          await this.handleOrderEvent(webhookData);
          break;
        case LAZADA_CONFIG.WEBHOOK_EVENTS.PRODUCT_CREATED:
        case LAZADA_CONFIG.WEBHOOK_EVENTS.PRODUCT_UPDATED:
          await this.handleProductEvent(webhookData);
          break;
        case LAZADA_CONFIG.WEBHOOK_EVENTS.INVENTORY_UPDATED:
          await this.handleInventoryEvent(webhookData);
          break;
        default:
          console.log('Unhandled Lazada webhook event:', webhookData.event);
      }

      // Send to Kafka for further processing
      await this.producer.send({
        topic: this.topic,
        messages: [
          {
            key: webhookData.event,
            value: JSON.stringify(webhookData),
          },
        ],
      });
    } catch (error) {
      console.error('Error handling Lazada webhook:', error);
      throw error;
    }
  }

  /**
   * Handle order events
   */
  private async handleOrderEvent(webhookData: LazadaWebhookDto) {
    try {
      const orderData = webhookData.data as LazadaOrderDto;

      // Process order data - sync with internal systems
      console.log('Processing Lazada order event:', orderData.order_id);

      // You can add custom logic here to:
      // - Update internal order status
      // - Send notifications
      // - Update inventory
      // - etc.
    } catch (error) {
      console.error('Error handling Lazada order event:', error);
    }
  }

  /**
   * Handle product events
   */
  private async handleProductEvent(webhookData: LazadaWebhookDto) {
    try {
      const productData = webhookData.data as LazadaProductDto;

      // Process product data
      console.log('Processing Lazada product event:', productData.item_id);

      // You can add custom logic here to:
      // - Sync product information
      // - Update local product database
      // - Trigger inventory updates
      // - etc.
    } catch (error) {
      console.error('Error handling Lazada product event:', error);
    }
  }

  /**
   * Handle inventory events
   */
  private async handleInventoryEvent(webhookData: LazadaWebhookDto) {
    try {
      console.log('Processing Lazada inventory event');

      // You can add custom logic here to:
      // - Update local inventory
      // - Trigger restock alerts
      // - Update pricing
      // - etc.
    } catch (error) {
      console.error('Error handling Lazada inventory event:', error);
    }
  }

  /**
   * Sync orders daily - scheduled job
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async syncOrdersDaily() {
    try {
      console.log('Starting daily Lazada orders sync...');

      // Get all active Lazada channels
      const channels = await this.channelService.findByType(ChannelType.LAZADA);

      for (const channel of channels) {
        // Check if channel has required credentials
      }

      console.log('Daily Lazada orders sync completed');
    } catch (error) {
      console.error('Error in daily Lazada orders sync:', error);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch (error) {
      console.error('Error verifying Lazada webhook signature:', error);
      return false;
    }
  }

  async auth(code: string) {
    const appKey = LAZADA_CONFIG.APP_KEY;
    const appSecret = LAZADA_CONFIG.APP_SECRET;

    try {
      const authData = await this.getAccessToken(code, appKey, appSecret);

      const channel = {
        name: authData.account,
        type: ChannelType.LAZADA,
        appId: authData.account_id ?? authData.account,
        accessToken: authData.access_token,
        refreshToken: authData.refresh_token,
        expireTokenTime: dayjs().add(authData.expires_in, 'seconds').toDate(),
      };

      await this.channelService.upsert(channel);

      return `${process.env.DASHBOARD_BASE_URL}/dashboard/channels?type=lazada&appId=${channel.appId}`;
    } catch (error) {
      throw error;
    }
  }

  async fetchMessagesWithinCustomTime(
    appId: string,
    time: number,
    unit: 'day' | 'week' | 'month',
  ): Promise<void> {
    const channel = await this.channelService.getByTypeAndAppId(
      ChannelType.LAZADA,
      appId,
    );
    if (!channel) {
      throw new Error(`Channel with appId ${appId} not found`);
    }

    let startTime = dayjs().subtract(time, unit).valueOf();
    while (true) {
      const response = await this.callLazadaAPI({
        endpoint: `/${LAZADA_CONFIG.ENDPOINTS.GET_SESSION_LIST}`,
        method: HttpMethod.GET,
        params: {
          start_time: startTime,
          page_size: 20, // Adjust as needed
        },
        appKey: LAZADA_CONFIG.APP_KEY,
        appSecret: LAZADA_CONFIG.APP_SECRET,
        accessToken: channel.accessToken,
      });

      const messages = response.data.data.session_list;

      if (messages && messages.length > 0) {
        for (const message of messages) {
          // Process each message
          console.log('Processing message:', message);
          // You can add your custom logic here
        }
      }
      if (!response.data.data.has_more) {
        break;
      }

      startTime = response.data.data.next_start_time;
    }
  }
}
