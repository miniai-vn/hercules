import {
  BadRequestException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { FACEBOOK_CONFIG } from './config/facebook.config';
import { ChannelsService } from 'src/channels/channels.service';
import { ChannelType } from 'src/channels/dto/channel.dto';
import { IPageInfo } from './types/page.type';
import { IConversationPageId } from './types/conversation.type';
dotenv.config();
Injectable();
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name);
  private readonly hubMode = 'subscribe';
  constructor(
    @Inject(forwardRef(() => ChannelsService))
    private readonly channelService: ChannelsService,
  ) {}

  // Connect to facebook:
  async connectToFacebook(res: any): Promise<string> {
    const state = uuidv4();

    const fbAuthUrl = new URL(
      `${FACEBOOK_CONFIG.FACEBOOK_PATH}${FACEBOOK_CONFIG.ENDPOINT.DIALOG_OAUTH}`,
    );

    fbAuthUrl.searchParams.append('client_id', FACEBOOK_CONFIG.APP.ID);
    fbAuthUrl.searchParams.append('redirect_uri', FACEBOOK_CONFIG.REDIRECT_URL);
    fbAuthUrl.searchParams.append('scope', FACEBOOK_CONFIG.SCOPE);
    fbAuthUrl.searchParams.append('state', state);

    return res.redirect(fbAuthUrl.toString());
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
          });
        }
      }

      const idPage = tokenPage.map((page) => {
        return page.id;
      });

      return `http://localhost:3000/dashboard/channels?type=facebook&appId=${idPage}`;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  private async getLongLiveTokenUser(code: string): Promise<string> {
    const tokenUrl = `${FACEBOOK_CONFIG.BASE_PATH_FACEBOOK}${FACEBOOK_CONFIG.ENDPOINT.OAUTH_ACCESS_TOKEN}`;
    const params = {
      client_id: FACEBOOK_CONFIG.APP.ID,
      client_secret: FACEBOOK_CONFIG.APP.SECRET,
      redirect_uri: FACEBOOK_CONFIG.REDIRECT_URL,
      code,
    };

    try {
      const shortTokenResp = await axios.get(tokenUrl, { params });

      const shortLivedToken = shortTokenResp.data.access_token;

      if (!shortLivedToken) {
        throw new Error('No short-lived access_token in response');
      }

      // 2. Gọi tiếp để lấy long-lived token
      const longTokenResp = await axios.get(tokenUrl, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: FACEBOOK_CONFIG.APP.ID,
          client_secret: FACEBOOK_CONFIG.APP.SECRET,
          fb_exchange_token: shortLivedToken,
        },
      });

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

  private async getTokenPages(tokenUser: string): Promise<IPageInfo[]> {
    const url = `${FACEBOOK_CONFIG.BASE_PATH_FACEBOOK}/me/accounts`;

    try {
      const resp = await axios.get(url, {
        params: {
          access_token: tokenUser,
          fields: 'id,name,access_token,picture{url}',
        },
      });

      return resp.data.data;
    } catch (error) {
      throw new Error(`Failed to get pages: ${error.message || error}`);
    }
  }

  async verifyWebhook(
    mode: string,
    token: string,
    challenge: string,
  ): Promise<string> {
    if (mode === this.hubMode && token === FACEBOOK_CONFIG.VERIFY_TOKEN) {
      return challenge;
    } else {
      throw new Error('Invalid verification token or mode');
    }
  }

  async handleMessage(event: any): Promise<void> {
    const senderId = event.sender.id;
    const pageId = event.recipient.id; // page gửi/nhận tin

    const text = event.message.text;

    const channel = await this.channelService.getByTypeAndAppId(
      ChannelType.FACEBOOK,
      pageId,
    );

    if (!channel?.accessToken) {
      throw new Error('Error accessToken');
    }

    try {
      await axios.post(
        `${FACEBOOK_CONFIG.BASE_PATH_FACEBOOK}me/messages`,
        {
          recipient: { id: senderId },
          message: {
            text: `${text}`,
          },
          // If you want to send message user 24h:
          tag: 'ACCOUNT_UPDATE',
        },
        { params: { access_token: channel.accessToken } },
      );
    } catch (error) {}
  }

  async handlePostback(event: any): Promise<void> {
    this.logger.log('This is postback');
    // const senderId = event.sender.id;
    // const payload = event.postback.payload;
    // console.log(`Received postback from ${senderId}: ${payload}`);
    // // Ví dụ trả về payload
    // await axios.post('https://graph.facebook.com/v23.0/me/messages', {
    //   recipient: { id: 'senderId' },
    //   message: {
    //     attachment: {
    //       type: 'template',
    //       payload: {
    //         template_type: 'button',
    //         text: 'Chọn một tùy chọn:',
    //         buttons: [
    //           {
    //             type: 'postback',
    //             title: 'Xem sản phẩm',
    //             payload: 'VIEW_PRODUCTS',
    //           },
    //           {
    //             type: 'postback',
    //             title: 'Liên hệ hỗ trợ',
    //             payload: 'CONTACT_SUPPORT',
    //           },
    //         ],
    //       },
    //     },
    //   },
    // });
  }

  // Get PSID from user sending a message to the Facebook page
  async getConversationPageId(
    access_token_page: string,
    page_id: string,
  ): Promise<IConversationPageId> {
    const url = `${FACEBOOK_CONFIG.BASE_PATH_FACEBOOK}/${page_id}/conversations`;
    const params = {
      access_token: access_token_page,
    };

    try {
      const response = await axios.get(url, { params });

      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  // async getMessage(conversations_id): Promise<any> {
  //   const url = `${FACEBOOK_CONFIG.BASE_PATH_FACEBOOK}/${conversations_id}/messages`;
  // }

  private async callFacebookAPI(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: any,
    headers?: Record<string, string>,
    baseUrl: string = FACEBOOK_CONFIG.FACEBOOK_PATH ||
      FACEBOOK_CONFIG.BASE_PATH_FACEBOOK,
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

      if (method === 'POST' && body) {
        config.data = body;
      } else if (method === 'GET' && body) {
        config.params = body;
      }

      return await axios(config);
    } catch (error) {
      throw new Error(`Facebook API call ${error.message}`);
    }
  }
}
