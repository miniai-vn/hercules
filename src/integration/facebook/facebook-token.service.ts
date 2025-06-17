import { FacebookHttpService } from './facebook-http.service';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { TokenDebugData, TokenDebugResponse } from './types/token-debug.type';
import { FACEBOOK_CONFIG } from './config/facebook.config';

dotenv.config();
@Injectable()
export class FacebookTokenService {
  private readonly logger = new Logger(FacebookTokenService.name);

  constructor(private readonly facebookHttpService: FacebookHttpService) {}

  /**
   * Refresh một long-lived token (user/page) bằng cách gọi lại OAuth endpoint
   * @param oldToken
   */
  async refreshLongLivedToken(oldToken: string): Promise<string> {
    const endpoint = FACEBOOK_CONFIG.ENDPOINT.OAUTH_ACCESS_TOKEN;
    const params = {
      grant_type: 'fb_exchange_token',
      client_id: FACEBOOK_CONFIG.APP.ID,
      client_secret: FACEBOOK_CONFIG.APP.SECRET,
      fb_exchange_token: oldToken,
    };

    try {
      const resp = await this.facebookHttpService.callFacebookAPI(
        endpoint,
        'GET',
        params,
        undefined,
        FACEBOOK_CONFIG.BASE_PATH_FACEBOOK,
      );

      const newToken = resp.data.access_token;
      if (!newToken) {
        throw new Error('No access_token in refresh response');
      }

      return newToken;
    } catch (error) {
      throw new Error(`Failed to refresh token: ${error.message || error}`);
    }
  }

  /**
   *
   * @param token
   * @returns
   */
  async debugAccessToken(token: string): Promise<TokenDebugData> {
    const endpoint = FACEBOOK_CONFIG.ENDPOINT.DEBUG_TOKEN;

    try {
      const params = {
        input_token: token,
        access_token: `${FACEBOOK_CONFIG.APP.ID}|${FACEBOOK_CONFIG.APP.SECRET}`,
      };

      const resp = await this.facebookHttpService.callFacebookAPI(
        endpoint,
        'GET',
        params,
        undefined,
        FACEBOOK_CONFIG.BASE_PATH_FACEBOOK,
      );

      if (!resp.data || !resp.data.data) {
        throw new Error('Invalid debug token response from Facebook');
      }

      return resp.data.data as TokenDebugData;
    } catch (error) {
      throw new Error(
        `Failed to debug access token: ${error.message || error}`,
      );
    }
  }

  /**
   * Kiểm tra token có gần hết hạn không.
   * @param token access token cần check
   * @param thresholdSeconds Ngưỡng tính bằng giây (mặc định 7 ngày)
   * @returns true nếu token sắp hết hạn, false nếu còn thời gian dài
   */
  async isTokenNearExpiry(
    token: string,
    channelId: number,
    thresholdSeconds = 7 * 24 * 3600,
  ): Promise<boolean> {
    try {
      const debugData = await this.debugAccessToken(token);

      if (!debugData.is_valid) {
        console.warn(
          `Token expired - Channel ID: ${channelId}, Token: ${token}`,
        );
        throw new UnauthorizedException('Token expired');
      }

      const now = Math.floor(Date.now() / 1000);
      const dataAccessExpiresAt = debugData.data_access_expires_at;

      // Nếu token hết hạn trong khoảng thresholdSeconds tới thì coi là gần hết hạn
      return dataAccessExpiresAt - now <= thresholdSeconds;
    } catch (error) {
      throw new Error(`${error.message || error}`);
    }
  }
}
