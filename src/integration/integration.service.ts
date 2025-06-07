import { Injectable } from '@nestjs/common';
import { AccessTokenTool, TikTokShopNodeApiClient } from 'tiktok_nodejs_sdk';

@Injectable()
export class IntegrationService {
  private readonly tiktokShopClient: TikTokShopNodeApiClient;

  private readonly accessToken =
    'ROW_BzQ_WwAAAACgwEU1fYC0ZV-2bZ5_7GibO9JA5TC20bbLs-U4RAtYzFFVe1RNGkbTTP7qWo3VjN_JjLKmd0KiizqHV-dCZFSQKK45F6PJ8XNrNXg1fWNe1g';

  constructor() {
    this.tiktokShopClient = new TikTokShopNodeApiClient({
      config: {
        app_key: process.env.TIKTOK_APP_KEY,
        app_secret: process.env.TIKTOK_APP_SECRET,
        basePath: 'https://open-api.tiktokglobalshop.com',
      },
    });
  }

  async authorizeTikTok() {
    try {
      const auth_code =
        'ROW_Qm3ydwAAAAAeqCZXCD9sS35IJr0a2e-pvWEvrw7p3a87BRLbUoIfh7ad_c1wwcWNvNe64td-xx_D4ELAO30-y9upD-hnKygMWZu8dBoMXDgi_Wei1QhphA';

      const { body } = await AccessTokenTool.getAccessToken(
        auth_code,
        process.env.TIKTOK_APP_KEY,
        process.env.TIKTOK_APP_SECRET,
      );
      console.log(
        'getAccessToken resp data := ',
        JSON.stringify(body, null, 2),
      );
      const access_token = body.data?.access_token;
      // if (!access_token) {
      //   throw new Error('Failed to get access token');
      // }
    } catch (error) {
      console.log(
        '🚀 ~ integration.service.ts:18 ~ IntegrationService ~ authorizeTikTok ~ error:',
        error,
      );
    }
  }

  async getAuthorizeShop() {
    try {
      const shop =
        await this.tiktokShopClient.api.AuthorizationV202309Api.ShopsGet(
          this.accessToken,
          'application/json',
        );

      console.log(
        '🚀 ~ integration.service.ts:48 ~ IntegrationService ~ getAuthorizeShop ~ shop:',
        shop.body.data,
      );
    } catch (error) {
      console.log(
        '🚀 ~ integration.service.ts:53 ~ IntegrationService ~ getAuthorizeShop ~ error:',
        error,
      );
    }
  }

  async getConversations() {
    try {
      const client = this.tiktokShopClient;

      const conversations =
        await this.tiktokShopClient.api.CustomerServiceV202309Api.ConversationsGet(
          20,
          this.accessToken,
          'application/json',
        );

      console.log(
        '🚀 ~ integration.service.ts:41 ~ IntegrationService ~ getConversations ~ conversations:',
        conversations,
      );
    } catch (error) {
      console.log(
        '🚀 ~ integration.service.ts:46 ~ IntegrationService ~ getConversations ~ error:',
        error,
      );
    }
  }

  async getProducts() {

    try {
      const products =
      await this.tiktokShopClient.api.ProductV202502Api.ProductsSearchPost(
        20,
        this.accessToken,
        'application/json',
        '',
        'ROW_ku-GIwAAAADWONepiLWepSfNy3FGr7u7',
      );

    console.log(
      '🚀 ~ integration.service.ts:61 ~ IntegrationService ~ getProducts ~ products:',
      products.body.data,
    );
    } catch (error) {
      console.log("🚀 ~ integration.service.ts:107 ~ IntegrationService ~ getProducts ~ error:", error)
      
    }
    
  }
}

// {
//       cipher: 'ROW_ku-GIwAAAADWONepiLWepSfNy3FGr7u7',
//       code: 'VNLCKAWM82',
//       id: '7496223074785986925',
//       name: 'SANDBOX7511936303799682821',
//       region: 'VN',
//       sellerType: 'LOCAL'
//     }
