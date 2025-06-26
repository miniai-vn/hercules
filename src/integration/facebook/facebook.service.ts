import { FacebookHttpService } from './facebook-http.service';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
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
import { TUserProfile } from './types/userProfile.type';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ChatService } from 'src/chat/chat.service';
dotenv.config();
Injectable();
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name);
  private readonly hubMode = 'subscribe';
  constructor(
    private readonly channelService: ChannelsService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly facebookHttpService: FacebookHttpService,
    private readonly facebookTokenService: FacebookTokenService,
  ) {}

  async connectToFacebook(): Promise<string> {
    const csrf = uuidv4();
    const statePayload = { csrf };
    const state = encodeURIComponent(JSON.stringify(statePayload));

    const fbAuthUrl = new URL(
      `${FACEBOOK_CONFIG.FACEBOOK_PATH}${FACEBOOK_CONFIG.ENDPOINT.DIALOG_OAUTH}`,
    );

    fbAuthUrl.searchParams.append('display', 'popup');
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
        'GET',
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
        'GET',
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
    const url = `${FACEBOOK_CONFIG.BASE_PATH_FACEBOOK}/me/accounts`;

    try {
      const resp = await axios.get(url, {
        params: {
          access_token: tokenUser,
          fields: 'id,name,access_token,picture{url},tasks',
        },
      });

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
        } else if (event.postback) {
          await this.handlePostback(event);
        }
      }
    }
  }

  /**
   * @description Send message to facebook user
   * @returns
   */
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
    };
    const response = await this.facebookHttpService.callFacebookAPI(
      endpoint,
      'POST',
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
        'GET',
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

  async handlePostback(event: any): Promise<void> {
    this.logger.log('This is postback');
  }

  async getUserProfileWithCache(
    query: FacebookUserProfileQueryDTO,
  ): Promise<TUserProfile> {
    const cacheKey = `fb:profile:${query.psid}`;
    let profile = await (this.cacheManager as any).get(cacheKey);

    if (profile) {
      return profile;
    }

    // Nếu chưa có trong cache thì gọi API thật
    profile = await this.getUserProfile(query);

    // Lưu vào cache (ttl mặc định lấy theo config)
    await (this.cacheManager as any).set(cacheKey, profile);

    return profile;
  }

  /**
   * Chạy mỗi giờ: kiểm tra tất cả token Facebook page trong DB,
   * nếu gần hết hạn thì refresh và update lại.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleTokenExpiryCheck() {
    // 1. Lấy tất cả channel có type FACEBOOK từ DB
    const fbChannels = await this.channelService.findByType(
      ChannelType.FACEBOOK,
    );

    for (const channel of fbChannels) {
      const { id: channelId, accessToken } = channel;
      try {
        // 2. Kiểm tra xem token page có gần hết hạn không
        const isNearExpiry = await this.facebookTokenService.isTokenNearExpiry(
          accessToken,
          channelId,
        );

        if (isNearExpiry) {
          // 3. Refresh token và lưu lại DB
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
