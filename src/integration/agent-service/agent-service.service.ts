import { Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { HttpMethod } from 'src/common/enums/http-method.enum';
import { AGENT_SERVICE_CONFIG } from './config/agent-service.config';

interface ChunkQueryParams {
  page?: number;
  page_size?: number;
  code?: string;
}

interface CreateChunkDto {
  code: string;
  page_content: string;
  metadata?: Record<string, any>;
}

interface UpdateChunkDto {
  page_content?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AgentServiceService {
  private readonly baseUrl = AGENT_SERVICE_CONFIG.BASE_URL;

  /**
   * Common method to handle Agent Service API calls
   */
  private async callAgentServiceAPI({
    endpoint,
    method = HttpMethod.GET,
    data,
    headers = {},
    params,
    timeout = 30000,
  }: {
    endpoint: string;
    method?: HttpMethod;
    data?: any;
    headers?: Record<string, string>;
    params?: any;
    timeout?: number;
  }): Promise<AxiosResponse> {
    try {
      const config: AxiosRequestConfig = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        timeout,
      };

      if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
        config.data = data;
      }

      if (params && method === HttpMethod.GET) {
        config.params = params;
      }

      console.log(`🤖 Agent Service API Call: ${method} ${config.url}`);

      const response = await axios(config);

      console.log(
        `✅ Agent Service Success: ${method} ${config.url} - Status: ${response.status}`,
      );

      return response;
    } catch (error) {
      console.error(`❌ Agent Service API call failed: ${error.message}`);
      throw new Error(`Agent Service API call failed: ${error.message}`);
    }
  }

  /**
   * Get all chunks with pagination and filtering
   * GET /api/chunks?page=1&page_size=5
   * GET /api/chunks?code=PROP001
   */
  async getChunks(queryParams?: ChunkQueryParams): Promise<AxiosResponse> {
    const params: Record<string, any> = {};

    if (queryParams?.page) params.page = queryParams.page;
    if (queryParams?.page_size) params.page_size = queryParams.page_size;
    if (queryParams?.code) params.code = queryParams.code;

    return this.callAgentServiceAPI({
      endpoint: AGENT_SERVICE_CONFIG.ENDPOINTS.GET_CHUNKS,
      method: HttpMethod.GET,
      params,
    });
  }

  /**
   * Get chunks for specific proposal code
   * GET /api/chunks?code=PROP001
   */
  async getChunksByCode(
    code: string,
    page?: number,
    pageSize?: number,
  ): Promise<AxiosResponse> {
    const params: Record<string, any> = { code };

    if (page) params.page = page;
    if (pageSize) params.page_size = pageSize;

    return this.callAgentServiceAPI({
      endpoint: AGENT_SERVICE_CONFIG.ENDPOINTS.GET_CHUNKS,
      method: HttpMethod.GET,
      params,
    });
  }

  /**
   * Get a single chunk by ID
   * GET /api/chunks/PROP001_12345-abcd-ef67
   */
  async getChunk(id: string): Promise<AxiosResponse> {
    const endpoint = AGENT_SERVICE_CONFIG.ENDPOINTS.GET_CHUNK.replace(
      ':id',
      id,
    );

    return this.callAgentServiceAPI({
      endpoint,
      method: HttpMethod.GET,
    });
  }

  /**
   * Create a new chunk
   * POST /api/chunks
   * {
   *   "code": "PROP002",
   *   "page_content": "This is a proposal chunk",
   *   "metadata": {"source": "document"}
   * }
   */
  async createChunk(createChunkDto: CreateChunkDto): Promise<AxiosResponse> {
    return this.callAgentServiceAPI({
      endpoint: AGENT_SERVICE_CONFIG.ENDPOINTS.CREATE_CHUNK,
      method: HttpMethod.POST,
      data: createChunkDto,
    });
  }

  /**
   * Update a chunk by ID
   * PUT /api/chunks/PROP001_12345-abcd-ef67
   * {
   *   "page_content": "Updated content"
   * }
   */
  async updateChunk(
    id: string,
    updateChunkDto: UpdateChunkDto,
  ): Promise<AxiosResponse> {
    const endpoint = AGENT_SERVICE_CONFIG.ENDPOINTS.UPDATE_CHUNK.replace(
      ':id',
      id,
    );

    return this.callAgentServiceAPI({
      endpoint,
      method: HttpMethod.PUT,
      data: {
        ...updateChunkDto,
        id, // Include ID in the data for consistency
      },
    });
  }

  /**
   * Delete a single chunk by ID
   * DELETE /api/chunks/PROP001_12345-abcd-ef67
   */
  async deleteChunk(id: string): Promise<AxiosResponse> {
    const endpoint = AGENT_SERVICE_CONFIG.ENDPOINTS.DELETE_CHUNK.replace(
      ':id',
      id,
    );

    return this.callAgentServiceAPI({
      endpoint,
      method: HttpMethod.DELETE,
    });
  }

  /**
   * Delete all chunks for a specific proposal code
   * DELETE /api/chunks/any_id?code=PROP001
   */
  async deleteChunksByCode(code: string): Promise<AxiosResponse> {
    // Using any_id as placeholder since the actual ID doesn't matter for bulk delete
    const endpoint = AGENT_SERVICE_CONFIG.ENDPOINTS.DELETE_CHUNK.replace(
      ':id',
      'bulk',
    );

    return this.callAgentServiceAPI({
      endpoint,
      method: HttpMethod.DELETE,
      params: { code },
    });
  }
}
