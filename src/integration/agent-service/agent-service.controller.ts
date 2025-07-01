import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { AgentServiceService } from './agent-service.service';
import { 
  ChunkQueryDto, 
  CreateChunkDto, 
  UpdateChunkDto, 
  ChunkResponseDto 
} from './dto/chunk.dto';

@ApiTags('Agent Service - Chunks')
@Controller('agent-service')
export class AgentServiceController {
  constructor(private readonly agentService: AgentServiceService) {}

  /**
   * Get all chunks with pagination and filtering
   */
  @Get('chunks')
  @ApiOperation({
    summary: 'Get all chunks',
    description: 'Retrieve chunks with optional pagination and filtering by code',
  })
  @ApiResponse({
    status: 200,
    description: 'Chunks retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/ChunkResponseDto' },
            },
            total: { type: 'number', example: 100 },
            page: { type: 'number', example: 1 },
            page_size: { type: 'number', example: 10 },
          },
        },
        status: { type: 'number', example: 200 },
      },
    },
  })
  async getChunks(@Query() query: ChunkQueryDto) {
    try {
      const response = await this.agentService.getChunks(query);
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve chunks',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get chunks by specific code
   */
  @Get('chunks/by-code/:code')
  @ApiOperation({
    summary: 'Get chunks by code',
    description: 'Retrieve all chunks for a specific code with pagination',
  })
  @ApiParam({
    name: 'code',
    description: 'The code to filter chunks by',
    example: 'PROP001',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'page_size',
    required: false,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Chunks retrieved successfully',
    type: ChunkResponseDto,
    isArray: true,
  })
  async getChunksByCode(
    @Param('code') code: string,
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
  ) {
    try {
      const response = await this.agentService.getChunksByCode(code, page, pageSize);
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: `Failed to retrieve chunks for code: ${code}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get a single chunk by ID
   */
  @Get('chunks/:id')
  @ApiOperation({
    summary: 'Get chunk by ID',
    description: 'Retrieve a single chunk by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'The chunk ID',
    example: 'PROP001_12345-abcd-ef67',
  })
  @ApiResponse({
    status: 200,
    description: 'Chunk retrieved successfully',
    type: ChunkResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Chunk not found',
  })
  async getChunk(@Param('id') id: string) {
    try {
      const response = await this.agentService.getChunk(id);
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        throw new HttpException(
          {
            success: false,
            message: `Chunk with ID ${id} not found`,
            error: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          success: false,
          message: `Failed to retrieve chunk: ${id}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create a new chunk
   */
  @Post('chunks')
  @ApiOperation({
    summary: 'Create new chunk',
    description: 'Create a new chunk with content and metadata',
  })
  @ApiResponse({
    status: 201,
    description: 'Chunk created successfully',
    type: ChunkResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async createChunk(@Body() createChunkDto: CreateChunkDto) {
    try {
      const response = await this.agentService.createChunk(createChunkDto);
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create chunk',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Update a chunk by ID
   */
  @Put('chunks/:id')
  @ApiOperation({
    summary: 'Update chunk',
    description: 'Update an existing chunk by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'The chunk ID to update',
    example: 'PROP001_12345-abcd-ef67',
  })
  @ApiResponse({
    status: 200,
    description: 'Chunk updated successfully',
    type: ChunkResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Chunk not found',
  })
  async updateChunk(
    @Param('id') id: string,
    @Body() updateChunkDto: UpdateChunkDto,
  ) {
    try {
      const response = await this.agentService.updateChunk(id, updateChunkDto);
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        throw new HttpException(
          {
            success: false,
            message: `Chunk with ID ${id} not found`,
            error: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          success: false,
          message: `Failed to update chunk: ${id}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete a single chunk by ID
   */
  @Delete('chunks/:id')
  @ApiOperation({
    summary: 'Delete chunk',
    description: 'Delete a single chunk by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'The chunk ID to delete',
    example: 'PROP001_12345-abcd-ef67',
  })
  @ApiResponse({
    status: 200,
    description: 'Chunk deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Chunk not found',
  })
  async deleteChunk(@Param('id') id: string) {
    try {
      const response = await this.agentService.deleteChunk(id);
      return {
        success: true,
        message: `Chunk ${id} deleted successfully`,
        status: response.status,
      };
    } catch (error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        throw new HttpException(
          {
            success: false,
            message: `Chunk with ID ${id} not found`,
            error: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          success: false,
          message: `Failed to delete chunk: ${id}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete all chunks for a specific code
   */
  @Delete('chunks/by-code/:code')
  @ApiOperation({
    summary: 'Delete chunks by code',
    description: 'Delete all chunks associated with a specific code',
  })
  @ApiParam({
    name: 'code',
    description: 'The code for which to delete all chunks',
    example: 'PROP001',
  })
  @ApiResponse({
    status: 200,
    description: 'Chunks deleted successfully',
  })
  async deleteChunksByCode(@Param('code') code: string) {
    try {
      const response = await this.agentService.deleteChunksByCode(code);
      return {
        success: true,
        message: `All chunks for code ${code} deleted successfully`,
        status: response.status,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: `Failed to delete chunks for code: ${code}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}