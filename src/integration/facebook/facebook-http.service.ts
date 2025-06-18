import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { FACEBOOK_CONFIG } from './config/facebook.config';

@Injectable()
export class FacebookHttpService {
  private readonly logger = new Logger(FacebookHttpService.name);

  /**
   * Gọi Facebook API chung (GET/POST)
   */
  async callFacebookAPI(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: Record<string, any>,
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
      throw new Error(`Facebook API call error: ${error.message}`);
    }
  }

  /**
   * Common method cho các OAuth API call của Facebook (ví dụ lấy token...)
   */
  async callFacebookOAuthAPI(
    endpoint: string,
    data: Record<string, any>,
  ): Promise<AxiosResponse> {
    // OAuth của Facebook không dùng secret_key header như Zalo mà dùng param hoặc basic auth,
    // ở đây giả sử data chứa đủ params
    return this.callFacebookAPI(
      endpoint,
      'POST',
      data,
      undefined,
      FACEBOOK_CONFIG.FACEBOOK_PATH || FACEBOOK_CONFIG.BASE_PATH_FACEBOOK,
    );
  }

  /**
   * Common method cho các API call với access token (truyền token trong headers hoặc params)
   */
  async callFacebookAuthenticatedAPI(
    endpoint: string,
    accessToken: string,
    method: 'GET' | 'POST' = 'GET',
    data?: Record<string, any>,
  ): Promise<AxiosResponse> {
    // Facebook thường truyền access_token trong params chứ không trong header
    // Nếu có header custom, bạn có thể thêm ở đâyF
    const params = {
      access_token: accessToken,
      ...(method === 'GET' && data ? data : {}),
    };

    const body = method === 'POST' ? data : undefined;

    return this.callFacebookAPI(
      endpoint,
      method,
      method === 'POST' ? body : params,
      undefined,
      FACEBOOK_CONFIG.BASE_PATH_FACEBOOK,
    );
  }
}
