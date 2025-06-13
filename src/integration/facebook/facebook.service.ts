import { HttpService } from '@nestjs/axios';
import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { FACEBOOK_CONFIG } from './config/facebook.config';
import { ChannelsService } from 'src/channels/channels.service';
import { ChannelType } from 'src/channels/dto/channel.dto';

Injectable();
export class FacebookService {
  private PAGE_ACCESS_TOKEN =
    'EABqzJdl9TjUBO76WoBBuirKxkxZCM73zGvGAH43fQBIZCcBMbHB58fmuJopC5JAlzNHW3ZAarAzhUdRd1uzvO36FYXmIdwsM7flQS41p3O88gMTIYDYey5g64NSbiRQVnCOuV2rETSVeX1CVfhDv0LCUteKGBF8U4HUxRrsccEXmMi4gqJVnXo2NGZCJ3V7WgariDBD8ZCiUOtd9ljo9f4ZBjr';
  private readonly VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;
  private readonly appId = process.env.FACEBOOK_APP_ID;
  private readonly appSecret = process.env.FACEBOOK_APP_SECRET;
  private readonly logger = new Logger(FacebookService.name);

  constructor(
    @Inject(forwardRef(() => ChannelsService))
    private readonly channelService: ChannelsService,
  ) {}

  // Connect to facebook:
  async connectToFacebook(res: any): Promise<string> {
    const state = uuidv4(); // dùng uuid để tạo state chống giả mạo

    const fbAuthUrl = new URL(
      `${FACEBOOK_CONFIG.FACEBOOK_PATH}${FACEBOOK_CONFIG.ENDPOINT.DIALOG_OAUTH}`,
    );

    fbAuthUrl.searchParams.append('client_id', FACEBOOK_CONFIG.APP.ID);
    fbAuthUrl.searchParams.append('redirect_uri', FACEBOOK_CONFIG.REDIRECT_URI);
    fbAuthUrl.searchParams.append('scope', FACEBOOK_CONFIG.SCOPE);
    fbAuthUrl.searchParams.append('state', state);

    // res.locals.state = state; // example of how you might store the state in the session or local storage
    // handle state validation in the callback

    this.logger.log(
      `Redirecting to Facebook OAuth URL: ${fbAuthUrl.toString()}`,
    );

    return res.redirect(fbAuthUrl.toString());
  }

  async callbackFacebook(code: string, state: string): Promise<any> {
    if (!code) {
      throw new HttpException(
        'Missing code in callback',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const tokenUser = await this.getTokenUser(code);

      const pages = await this.getTokenPages(tokenUser);
      console.log(` pages:: `, pages);

      const tokenPage = pages.map((page) => {
        console.log(` page:: `, page);
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

      return {
        message: 'Successfully connected to Facebook',
        tokenUser,
        tokenPage,
      };
    } catch (err) {
      // lỗi thì redirect về page lỗi của bạn hoặc trả JSON
      return {
        message: 'Failed to exchange code for token',
        error: err.message,
      };
    }
  }

  async getTokenUser(code: string): Promise<string> {
    const tokenUrl = `${FACEBOOK_CONFIG.BASE_PATH_FACEBOOK}${FACEBOOK_CONFIG.ENDPOINT.OAUTH_ACCESS_TOKEN}`;
    const params = {
      client_id: FACEBOOK_CONFIG.APP.ID,
      client_secret: FACEBOOK_CONFIG.APP.SECRET,
      redirect_uri: FACEBOOK_CONFIG.REDIRECT_URI,
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

      console.log('data access-token: ', longTokenResp.data);

      const longLivedToken = longTokenResp.data.access_token;

      if (!longLivedToken) {
        throw new Error('No long-lived access_token in response');
      }

      return longLivedToken;
    } catch (error) {
      this.logger.error('Error exchanging code for token:', error);
      throw new Error(
        `Failed to exchange code for token: ${error.message || error}`,
      );
    }
  }

  async getTokenPages(tokenUser: string): Promise<any[]> {
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
      this.logger.error('Error getting pages:', error);
      throw new Error(`Failed to get pages: ${error.message || error}`);
    }
  }

  // async getPageAccessToken(userToken: string): Promise<string> {
  //   const url = `${FACEBOOK_CONFIG.BASE_PATH_FACEBOOK}me/accounts`;
  //   const headers = {
  //     Authorization: `Bearer ${userToken}`,
  //   };

  //   try {
  //     const response = await axios.get(url, { headers });
  //     console.log('Response from Facebook getPageAccessToken:', response.data);

  //     // Gán PAGE_ACCESS_TOKEN từ response

  //     // Giả sử bạn muốn lấy access token của trang đầu tiên
  //     this.PAGE_ACCESS_TOKEN = response.data.data[0].access_token;

  //     console.log('Page Access Token:', this.PAGE_ACCESS_TOKEN);

  //     return response.data.data.map((page: any) => ({
  //       id: page.id,
  //       name: page.name,
  //       access_token: page.access_token,
  //     }));
  //   } catch (error) {
  //     console.error('Failed to get page access token:', error);
  //     throw error;
  //   }

  //   // Normally, you would retrieve the page access token from a secure store or environment variable
  // }

  async verifyWebhook(
    mode: string,
    token: string,
    challenge: string,
  ): Promise<any> {
    if (mode === 'subscribe' && token === this.VERIFY_TOKEN) {
      this.logger.log(
        `Webhook verified with mode: ${mode}, token: ${token}, challenge: ${challenge}`,
      );

      // return challenge to confirm verification
      return challenge;
    } else {
      throw new Error('Invalid verification token or mode');
    }
  }

  async handleMessage(event: any) {
    const senderId = event.sender.id;
    const text = event.message.text;
    console.log(`Received message from ${senderId}: ${text}`);

    await axios.post(
      `${FACEBOOK_CONFIG.BASE_PATH_FACEBOOK}me/messages`,
      {
        recipient: { id: senderId },
        message: { text: `${'chao ban'}` },
      },
      { params: { access_token: this.PAGE_ACCESS_TOKEN } },
    );
  }

  // async handlePostback(event: any): Promise<void> {
  //   const senderId = event.sender.id;
  //   const payload = event.postback.payload;
  //   console.log(`Received postback from ${senderId}: ${payload}`);

  //   // Ví dụ trả về payload
  //   await axios.post('https://graph.facebook.com/v23.0/me/messages', {
  //     recipient: { id: 'senderId' },
  //     message: {
  //       attachment: {
  //         type: 'template',
  //         payload: {
  //           template_type: 'button',
  //           text: 'Chọn một tùy chọn:',
  //           buttons: [
  //             {
  //               type: 'postback',
  //               title: 'Xem sản phẩm',
  //               payload: 'VIEW_PRODUCTS',
  //             },
  //             {
  //               type: 'postback',
  //               title: 'Liên hệ hỗ trợ',
  //               payload: 'CONTACT_SUPPORT',
  //             },
  //           ],
  //         },
  //       },
  //     },
  //   });
  // }
  // // Get PSID from user sending a message to the Facebook page

  async getIdConversations(
    access_token_page: string,
    page_id: string,
  ): Promise<any> {
    const url = `${FACEBOOK_CONFIG.BASE_PATH_FACEBOOK}/${page_id}/conversations`;
    const params = {
      access_token: access_token_page,
    };

    try {
      const response = await axios.get(url, { params });
      console.log(
        'Response from Facebook getIdConversations:',
        response.data.data,
      );

      return response.data.data;
    } catch (error) {
      this.logger.error('Error getting conversations from Facebook:', error);
      throw error;
    }
  }

  async getMessage(conversations_id): Promise<any> {
    const url = `${FACEBOOK_CONFIG.BASE_PATH_FACEBOOK}/${conversations_id}/messages`;
  }
}
