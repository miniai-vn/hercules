import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig, Method } from 'axios';
import { firstValueFrom } from 'rxjs';
@Injectable()
export class OAService {
  private readonly logger = new Logger(OAService.name);
  private readonly oaBaseUrl: string;
  private readonly oaApiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.oaBaseUrl = this.configService.get<string>('OA_BASE_URL');
    this.oaApiKey = this.configService.get<string>('OA_BASE_KEY');

    if (!this.oaBaseUrl) {
      this.logger.warn('OA_BASE_URL is not defined in environment variables.');
    }
    if (!this.oaApiKey) {
      this.logger.warn('OA_BASE_KEY is not defined in environment variables.');
    }
  }

  private async fetchOa<T = any>(
    method: Method,
    prefix: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<T> {
    if (!this.oaBaseUrl || !this.oaApiKey) {
      const errorMessage =
        'OA service is not configured. Missing OA_BASE_URL or OA_BASE_KEY.';
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    const url = `${this.oaBaseUrl.replace(/\/$/, '')}/${prefix.replace(/^\//, '')}`;

    const requestConfig: AxiosRequestConfig = {
      method,
      url,
      headers: {
        Authorization: `Bearer ${this.oaApiKey}`, // Assuming Bearer token, adjust if different
        ...headers,
      },
    };

    if (data) {
      if (method === 'GET' || method === 'get') {
        requestConfig.params = data;
      } else {
        requestConfig.data = data;
      }
    }

    this.logger.debug(
      `Fetching OA: ${method} ${url} with data: ${JSON.stringify(data)}`,
    );

    try {
      const response = await firstValueFrom(
        this.httpService.request<T>(requestConfig),
      );
      this.logger.debug(`OA Response for ${method} ${url}: ${response.status}`);
      return response.data;
    } catch (error) {}
  }

  async sendChannelIdForMiniapp(data: {
    id?: number; // department_id
    appId?: string;
    oaId?: string;
  }): Promise<any> {
    // Return type can be more specific if you know the OA API response
    this.logger.log(`Sending channel ID for miniapp: ${JSON.stringify(data)}`);
    return this.fetchOa(
      'POST',
      'api/oa/update-shop-settings', // Matches Python prefix
      data,
      { 'Content-Type': 'application/json' },
    );
  }

  async sendStatusChannel(data: {
    id?: number; // department_id
    status: string;
  }): Promise<any> {
    // Return type can be more specific
    this.logger.log(`Sending status for channel: ${JSON.stringify(data)}`);
    return this.fetchOa(
      'POST',
      'api/oa/receive-status-channel', // Matches Python prefix
      data,
      { 'Content-Type': 'application/json' },
    );
  }
}
