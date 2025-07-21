import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/gaurds/permission.guard';
import { AgentServiceService } from './agent-service.service';
import {
  ChunkQueryDto,
  ChunkResponseDto,
  CreateChunkDto,
  UpdateChunkDto,
} from './dto/chunk.dto';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { PermissionCode } from 'src/common/enums/permission.enum';

@ApiTags('Agent Service - Chunks')
@Controller('agent-service')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AgentServiceController {
  constructor(private readonly agentService: AgentServiceService) {}

  /**
   * Get all chunks with pagination and filtering
   */
  @Get('chunks')
  @ApiOperation({
    summary: 'Get all chunks',
    description:
      'Retrieve chunks with optional pagination and filtering by code',
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
        data: response.data.data,
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
  @RequirePermissions(PermissionCode.CHUNK_READ)
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
    @Req() req,
    @Param('code') code: string,
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
  ) {
    try {
      const response = await this.agentService.getChunksByCode(
        code,
        page,
        pageSize,
        req.user.shopId,
      );
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
  @RequirePermissions(PermissionCode.CHUNK_READ)
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
  async getChunk(@Req() req, @Param('id') id: string) {
    try {
      const response = await this.agentService.getChunk(id, req.user.shopId);
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      if (
        error.message.includes('404') ||
        error.message.includes('not found')
      ) {
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
  async updateChunk(@Body() updateChunkDto: UpdateChunkDto) {
    try {
      const response = await this.agentService.updateChunk({
        pk: updateChunkDto.pk,
        text: updateChunkDto.text,
      });
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: `Failed to update chunk`,
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
      if (
        error.message.includes('404') ||
        error.message.includes('not found')
      ) {
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
  @RequirePermissions(PermissionCode.CHANNEL_READ)
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
  async deleteChunksByCode(@Req() req, @Param('code') code: string) {
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
