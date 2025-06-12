import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { ChannelsService } from 'src/channels/channels.service';
import { ChannelType } from 'src/channels/dto/channel.dto';
import { ZALO_CONFIG } from './config/zalo.config';
import { ZaloWebhookDto } from './dto/zalo-webhook.dto';
dotenv.config();
@Injectable()
export class ZaloService {
  private readonly logger = new Logger(ZaloService.name);
  private readonly accessToken: string;
  private readonly baseUrl: string;

  constructor(private readonly channelService: ChannelsService) {}

  async getAccessToken(oa_id: string, code: string) {
    try {
      const config = {
        headers: {
          secret_key: process.env.ZALO_APP_SECRET,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      };

      const requestData = {
        code,
        app_id: process.env.ZALO_APP_ID,
        grant_type: 'authorization_code',
      };

      const response = await axios.post(
        'https://oauth.zaloapp.com/v4/oa/access_token',
        requestData,
        config,
      );

      const infoOa = await axios.get('https://openapi.zalo.me/v2.0/oa/getoa', {
        headers: {
          access_token: response.data.access_token,
        },
      });
      const channel = await this.channelService.getByTypeAndAppId(
        ChannelType.ZALO,
        infoOa.data.data.oa_id,
      );
      if (channel) {
        await this.channelService.update(channel.id, {
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
        });
      } else {
        await this.channelService.create({
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
          appId: infoOa.data.data.oa_id,
          avatar: infoOa.data.data.avatar,
          name: infoOa.data.data.name,
          type: ChannelType.ZALO,
        });
      }
      return `http://localhost:3000/dashboard/channels?type=zalo&appId=${infoOa.data.data.oa_id}`;
    } catch (error) {
      this.logger.error('Error getting access token:', error);
    }
  }

  async handleWebhook(payload: ZaloWebhookDto): Promise<void> {
    this.logger.log('Zalo webhook received:', JSON.stringify(payload, null, 2));

    try {
      switch (payload.event_name) {
        case ZALO_CONFIG.WEBHOOK_EVENTS.USER_SEND_TEXT:
          await this.handleTextMessage(payload);
          break;
        case ZALO_CONFIG.WEBHOOK_EVENTS.USER_SEND_IMAGE:
          await this.handleImageMessage(payload);
          break;
        case ZALO_CONFIG.WEBHOOK_EVENTS.USER_SEND_FILE:
          await this.handleFileMessage(payload);
          break;
        case ZALO_CONFIG.WEBHOOK_EVENTS.USER_SEND_STICKER:
          await this.handleStickerMessage(payload);
          break;
        default:
          this.logger.warn(`Unhandled event type: ${payload.event_name}`);
      }
    } catch (error) {
      this.logger.error('Error handling webhook:', error);
      throw error;
    }
  }

  private async handleTextMessage(payload: ZaloWebhookDto): Promise<void> {
    this.logger.log(`Processing text message: ${payload.message?.text}`);
    // Add your text message processing logic here
  }

  private async handleImageMessage(payload: ZaloWebhookDto): Promise<void> {
    this.logger.log('Processing image message');
    // Add your image message processing logic here
  }

  private async handleFileMessage(payload: ZaloWebhookDto): Promise<void> {
    this.logger.log('Processing file message');
    // Add your file message processing logic here
  }

  private async handleStickerMessage(payload: ZaloWebhookDto): Promise<void> {
    this.logger.log('Processing sticker message');
    // Add your sticker message processing logic here
  }
}
