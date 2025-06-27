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
import { LAZADA_CONFIG } from './config/lazada.config';
import {
  LazadaWebhookDto,
  LazadaOrderDto,
  LazadaProductDto,
  LazadaAuthDto,
  LazadaInventoryUpdateDto,
} from './dto/lazada-webhook.dto';
import * as crypto from 'crypto';

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
    // @InjectQueue(process.env.REDIS_LAZADA_SYNC_TOPIC)
    // private readonly lazadaSyncQueue: Queue,
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
   * Get orders from Lazada
   */
  async getOrders(
    appKey: string,
    appSecret: string,
    accessToken: string,
    params?: {
      created_after?: string;
      created_before?: string;
      updated_after?: string;
      updated_before?: string;
      status?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    try {
      const response = await this.callLazadaAPI({
        endpoint: LAZADA_CONFIG.ENDPOINTS.GET_ORDERS,
        params,
        appKey,
        appSecret,
        accessToken,
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get Lazada orders: ${error.message}`);
    }
  }

  /**
   * Get products from Lazada
   */
  async getProducts(
    appKey: string,
    appSecret: string,
    accessToken: string,
    params?: {
      filter?: string;
      search?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    try {
      const response = await this.callLazadaAPI({
        endpoint: LAZADA_CONFIG.ENDPOINTS.GET_PRODUCTS,
        params,
        appKey,
        appSecret,
        accessToken,
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get Lazada products: ${error.message}`);
    }
  }

  /**
   * Update product inventory
   */
  async updateInventory(
    appKey: string,
    appSecret: string,
    accessToken: string,
    inventoryData: LazadaInventoryUpdateDto,
  ) {
    try {
      const response = await this.callLazadaAPI({
        endpoint: LAZADA_CONFIG.ENDPOINTS.UPDATE_PRICE_QUANTITY,
        method: 'POST',
        data: {
          Request: {
            Product: {
              ItemId: inventoryData.item_id,
              Skus: inventoryData.skus.map((sku) => ({
                SellerSku: sku.SellerSku,
                Quantity: sku.Quantity,
                Price: sku.Price,
              })),
            },
          },
        },
        appKey,
        appSecret,
        accessToken,
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to update Lazada inventory: ${error.message}`);
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
        if (channel.appSecret && channel.accessToken) {
          //   await this.lazadaSyncQueue.add('sync-orders', {
          //     channelId: channel.id,
          //     appKey: channel.appId,
          //     appSecret: channel.appSecret,
          //     accessToken: channel.accessToken,
          //   });
        }
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
}
