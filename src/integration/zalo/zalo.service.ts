import { InjectQueue } from '@nestjs/bullmq';
import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Queue } from 'bullmq';
import dayjs from 'dayjs';
import * as dotenv from 'dotenv';
import { Producer } from 'kafkajs';
import { Channel } from 'src/channels/channels.entity';
import { ChannelsService } from 'src/channels/channels.service';
import { ChannelType } from 'src/channels/dto/channel.dto';
import { ZaloMessageDto } from 'src/chat/dto/chat-zalo.dto';
import { HttpMethod } from 'src/common/enums/http-method.enum';
import { MessageType } from 'src/common/enums/message.enum';
import { delay, isAfter } from 'src/common/utils/utils';
import { ConversationsService } from 'src/conversations/conversations.service';
import { Platform } from 'src/customers/customers.dto';
import { CustomersService } from 'src/customers/customers.service';
import { KafkaProducerService } from 'src/kafka/kafka.producer';
import { ZALO_CONFIG } from './config/zalo.config';
import { TagsService } from 'src/tags/tags.service';
import { ZaloJobEvent } from 'src/common/enums/job-event.enum';

dotenv.config();

@Injectable()
export class ZaloService {
  private readonly logger = new Logger(ZaloService.name);
  private readonly topic = process.env.KAFKA_ZALO_MESSAGE_TOPIC;
  producer: Producer;
  constructor(
    @Inject(forwardRef(() => ChannelsService))
    private readonly channelService: ChannelsService,
    private readonly kafkaProducerService: KafkaProducerService,
    private readonly customerService: CustomersService,
    private readonly conversationService: ConversationsService,
    private readonly tagService: TagsService,
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

      const channel = await this.channelService.upsert({
        type: ChannelType.ZALO,
        appId: infoOa.data.data.oa_id,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expireTokenTime: expireTokenTime,
        avatar: infoOa.data.data.avatar,
        name: infoOa.data.data.name,
      });

      if (!channel) {
        throw new Error('Failed to upsert Zalo channel');
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
   * Upload image to Zalo
   */
  async uploadImage(
    accessToken: string,
    file: Blob,
    fileName: string,
  ): Promise<AxiosResponse> {
    const formData = new FormData();
    formData.append('file', file, fileName);
    return this.callZaloAuthenticatedAPI(
      ZALO_CONFIG.ENDPOINTS.UPLOAD_IMAGE,
      accessToken,
      HttpMethod.POST,
      formData,
      {
        headers: {
          'Content-Type': `multipart/form-data`,
        },
      },
    );
  }

  /**
   * Upload file to Zalo
   */

  async uploadFile(
    accessToken: string,
    file: Blob,
    fileName: string,
  ): Promise<AxiosResponse> {
    const formData = new FormData();
    formData.append('file', file, fileName);

    return this.callZaloAuthenticatedAPI(
      ZALO_CONFIG.ENDPOINTS.UPLOAD_FILE,
      accessToken,
      HttpMethod.POST,
      formData,
      {
        headers: {
          'Content-Type': `multipart/form-data`,
        },
      },
    );
  }

  /**
   * Send message to Zalo user
   */
  async sendMessage(
    accessToken: string,
    message?: string,
    zaloId?: string,
    quoteMsgId?: string,
    attachment?: {
      type: 'file' | 'template';
      payload: {
        token?: string;
        template_type?: string;
        elements?: {
          media_type: string;
          url?: string;
          attachment_id?: string;
        }[];
      };
    },
  ): Promise<AxiosResponse> {
    const data = {
      recipient: {
        user_id: zaloId,
      },
      message: {
        ...(message ? { text: message } : {}),
        ...(quoteMsgId ? { quote_message_id: quoteMsgId } : {}),
        ...(attachment ? { attachment } : {}),
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

  /**
   * Fetch conversations from Zalo
   */
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

  /**
   * Sync conversations with a specific user ID
   *
   */

  async handleSyncConversationsByUserId(
    user_id: string,
    appId: string,
    messageCount: number = 30,
  ) {
    try {
      this.logger.log(
        `Start handleSyncConversationsByUserId for user_id: ${user_id}, appId: ${appId}`,
      );
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
          !response.data.data ||
          response.data.data.length === 0 ||
          response.data.data.total <= offset
        ) {
          break;
        }

        for (let msg of response.data.data) {
          const isFromUser = msg.src === 1;

          const customer = await this.customerService.upsertUser({
            platform: Platform.ZALO,
            externalId: isFromUser ? msg.from_id : msg.to_id,
            name: isFromUser ? msg.from_display_name : msg.to_display_name,
            avatar: isFromUser ? msg.from_avatar : msg.to_avatar,
            channelId: channel.id,
          });

          const externalConversation = {
            id: customer.externalId,
            timestamp: new Date(msg.time ?? ''),
          };

          msg = this.transferMessage(msg);

          if (isFromUser) {
            await this.conversationService.handleUserMessage({
              channel: channel,
              customer: customer,
              message: msg,
              externalConversation,
              isSync: true,
            });
          } else {
            await this.conversationService.handleChannelMessage({
              channel: channel,
              customer: customer,
              message: msg,
              externalConversation,
              isSync: true,
            });
          }
        }

        if (messageCount && count >= messageCount) {
          break;
        }
        offset += count;
      }
      this.logger.log(
        `Finished handleSyncConversationsByUserId for user_id: ${user_id}, appId: ${appId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to sync conversations with user ID ${user_id}: ${error.message}`,
        error.stack,
      );
      throw new Error(
        `Failed to sync conversations with user ID ${user_id}: ${error.message}`,
      );
    }
  }

  private transferMessage(message): {
    content: string;
    contentType: MessageType;
    id: string;
    links?: string[];
    createdAt: dayjs.Dayjs;
  } {
    switch (message.type) {
      case MessageType.TEXT:
        return {
          content: message.message,
          contentType: MessageType.TEXT,
          id: message.message_id,
          createdAt: dayjs(message.time),
        };
      case 'photo':
        return {
          content: '',
          links: [message.thumb],
          contentType: MessageType.IMAGE,
          id: message.message_id,
          createdAt: dayjs(message.time),
        };
      case MessageType.STICKER:
        return {
          content: '',
          contentType: MessageType.STICKER,
          links: [message.url],
          id: message.message_id,
          createdAt: dayjs(message.time),
        };

      default:
        return {
          content: message.message,
          contentType: MessageType.TEXT,
          id: message.message_id,
          createdAt: dayjs(message.time),
        };
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

  /**
   *
   * Fetch all users from Zalo
   */

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
      const user = allUsers[i];

      const profileResponse = await this.getUserProfile(
        channel.accessToken,
        user.user_id,
      );

      user.profile = profileResponse.data.data || {};

      await this.customerService.upsertUser({
        platform: Platform.ZALO,
        externalId: user.user_id,
        name: user.profile.display_name || '',
        shopId: channel?.shop?.id || null,
        channelId: channel?.id || null,
        avatar: user.profile.avatar || '',
        note: user.profile.tags_and_notes_info?.note || '',
        tagNames: user.profile.tags_and_notes_info?.tag_names || [],
      });
      delay(Math.random() * 1000);
    }
    return allUsers;
  }

  /**
   * Fetch user list from Zalo
   *
   */

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
    const zaloChannels = await this.channelService.findByType(ChannelType.ZALO);

    if (!zaloChannels || zaloChannels.length === 0) {
      return;
    }

    for (const channel of zaloChannels) {
      if (this.needsTokenRefresh(channel)) {
        await this.refreshAccessToken(channel);
      }
    }
  }

  /**
   * Manually refresh the access token for a specific Zalo channel
   */

  async manualTokenRefresh(appId: string) {
    try {
      const channel = await this.channelService.getByTypeAndAppId(
        ChannelType.ZALO,
        appId,
      );

      const success = await this.refreshAccessToken(channel);

      return {
        success,
        message: success,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Transform raw message data to a format suitable for processing
   */

  handleRawMessage(message): ZaloMessageDto {
    if (!message.attachments || !message.attachments.length) {
      return {
        ...message,
        contentType: MessageType.TEXT,
      };
    }
    const links = message.attachments.map((item) => item.payload.url);

    return {
      ...message,
      links,
      msg_id: message.msg_id,
      contentType: MessageType.TEXT,
    };
  }

  /**
   * Handle Zalo webhook events
   */

  async handleWebhook(payload): Promise<void> {
    try {
      const message = this.handleRawMessage(payload.message);
      switch (payload.event_name) {
        case ZALO_CONFIG.WEBHOOK_EVENTS.USER_SEND_TEXT:
          await this.handleProducerMessage({
            ...payload,
            message,
          });
          break;

        // case ZALO_CONFIG.WEBHOOK_EVENTS.OA_SEND_TEXT:
        //   await this.handleProducerMessage({
        //     ...payload,
        //     message,
        //   });
        //   break;

        case ZALO_CONFIG.WEBHOOK_EVENTS.USER_SEND_STICKER:
          await this.handleProducerMessage({
            ...payload,
            message,
          });
          break;

        case ZALO_CONFIG.WEBHOOK_EVENTS.USER_SEND_IMAGE:
          await this.handleProducerMessage({
            ...payload,
            message: {
              ...message,
              contentType: MessageType.IMAGE,
            },
          });
          break;

        default:
          // Silent ignore
          break;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle producer message for Zalo webhook events
   **/

  private async handleProducerMessage(payload): Promise<void> {
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
   * Fetch tags of Zalo OA
   */

  async fetchTags(accessToken: string): Promise<AxiosResponse> {
    return this.callZaloAuthenticatedAPI(
      ZALO_CONFIG.ENDPOINTS.GET_TAGS,
      accessToken,
      HttpMethod.GET,
    );
  }

  /**
   * upsert tags for Zalo OA
   */

  async upsertTags(appId: string) {
    try {
      this.logger.log(`Start upsertTags for appId: ${appId}`);
      const channel = await this.channelService.getByTypeAndAppId(
        ChannelType.ZALO,
        appId,
      );

      const tags = await this.fetchTags(channel.accessToken);
      if (!tags.data || !tags.data.data) {
        this.logger.warn(`No tags found for appId: ${appId}`);
        return;
      }

      await Promise.all(
        tags.data.data.map(async (tag) => {
          await this.tagService.findOrCreate({
            name: tag,
            channel,
          });
        }),
      );
      this.logger.log(`Upserted tags for appId: ${appId}`);
    } catch (error) {
      this.logger.error(
        `Failed to upsert tags for Zalo OA: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException({
        message: `Failed to upsert tags for Zalo OA: ${error.message}`,
        error: error,
      });
    }
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
    this.logger.log(`Start fetchMessagesWithinCustomTime for appId: ${appId}`);
    const channel = await this.channelService.getByTypeAndAppId(
      ChannelType.ZALO,
      appId,
    );
    let offset = 0;
    let count = 10;
    const processedMessages = [];
    const jobIdSet = new Set();

    while (true) {
      const response = await this.fetchRecentChat({
        accessToken: channel.accessToken,
        offset,
        count,
      });

      if (!response.data.data || response.data.data.length === 0) {
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
        const jobId = `${appId}-${userId}`;

        if (!jobIdSet.has(jobId)) {
          processedMessages.push({
            name: 'sync-zalo-conversations-with-user',
            data: {
              userId: userId,
              appId: appId,
              messageCount,
            },
            opts: {
              jobId,
              removeOnComplete: true,
              removeOnFail: true,
            },
          });
          jobIdSet.add(jobId);
        }
      }

      if (shouldBreak) {
        break;
      }

      offset += 1;
    }

    await this.zaloSyncQueue.addBulk(processedMessages);
    this.logger.log(
      `Finished fetchMessagesWithinCustomTime for appId: ${appId}, jobs: ${processedMessages.length}`,
    );
    return processedMessages;
  }

  async syncDataAppId(appId: string) {
    if (!appId) {
      this.logger.error('App ID is required for syncDataAppId');
      throw new Error('App ID is required');
    }
    this.logger.log(`Start syncing conversations for appId: ${appId}`);
    this.zaloSyncQueue.add(
      ZaloJobEvent.SYNC_CONVERSATIONS,
      {
        appId: appId,
      },
      {
        jobId: `sync-conversations-${appId}`,
        removeOnComplete: true,
        removeOnFail: true,
      },
    );

    const schedulerId = `sync-conversations-${appId}`;
    this.zaloSyncQueue.upsertJobScheduler(
      schedulerId,
      {
        every: 24 * 60 * 60 * 1000,
        startDate: new Date(Date.now() + 10 * 60 * 1000),
      },
      {
        name: ZaloJobEvent.SYNC_DAILY_CONVERSATIONS,
        data: {
          appId,
        },
      },
    );

    this.logger.log(`Scheduled daily sync for appId: ${appId}`);
    await this.upsertTags(appId);
    this.logger.log(`Finished syncDataAppId for appId: ${appId}`);

    await this.getAllUsers(appId);
    return appId;
  }
}
