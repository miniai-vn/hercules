import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.module';
import { ConversationsService } from './conversations.service';
import { ConversationListFEResponseDto } from './dto/conversation-fe.dto';
import {
  AddParticipantsDto,
  ConversationBulkDeleteDto,
  ConversationQueryParamsDto,
  ConversationResponseDto,
  CreateConversationDto,
  PaginatedConversationsDto,
  RemoveParticipantsDto,
  UpdateConversationDto,
} from './dto/conversation.dto';
import * as jwt from 'jsonwebtoken';

interface ApiResponse<T> {
  message: string;
  data: T;
}

@ApiTags('conversations')
@ApiBearerAuth('bearerAuth') // Use the security scheme name from main.ts
@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createConversationDto: CreateConversationDto,
  ): Promise<ApiResponse<ConversationResponseDto>> {
    const conversation = await this.conversationsService.create(
      createConversationDto,
    );
    return {
      message: 'Conversation created successfully',
      data: conversation,
    };
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search', new DefaultValuePipe('')) search: string,
  ): Promise<ApiResponse<PaginatedConversationsDto>> {
    const conversations = await this.conversationsService.findAll(
      page,
      limit,
      search,
    );
    return {
      message: 'Conversations retrieved successfully',
      data: conversations,
    };
  }

  @Get('frontend')
  @ApiOperation({ summary: 'Get conversations in frontend format' })
  @ApiResponse({
    status: 200,
    description: 'Returns conversations formatted for frontend consumption',
    type: ConversationListFEResponseDto,
  })
  async getConversationsForFrontend(): Promise<ConversationListFEResponseDto> {
    return this.conversationsService.getConversationsForFrontend();
  }
  @Get('query')
  async query(
    @Query() queryParams: ConversationQueryParamsDto,
  ): Promise<ApiResponse<ConversationResponseDto[]>> {
    const conversations = await this.conversationsService.query(queryParams);
    return {
      message: 'Conversations queried successfully',
      data: conversations,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<ConversationResponseDto>> {
    const conversation = await this.conversationsService.findOne(id);
    return {
      message: 'Conversation retrieved successfully',
      data: conversation,
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateConversationDto: UpdateConversationDto,
  ): Promise<ApiResponse<ConversationResponseDto>> {
    const conversation = await this.conversationsService.update(
      id,
      updateConversationDto,
    );
    return {
      message: 'Conversation updated successfully',
      data: conversation,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<{ id: number }>> {
    await this.conversationsService.remove(id);
    return {
      message: 'Conversation deleted successfully',
      data: { id },
    };
  }

  @Post('bulk-delete')
  async bulkDelete(@Body() bulkDeleteDto: ConversationBulkDeleteDto): Promise<
    ApiResponse<{
      totalRequested: number;
      deletedCount: number;
      notFoundCount: number;
    }>
  > {
    const result = await this.conversationsService.bulkDelete(bulkDeleteDto);
    return {
      message: 'Bulk delete operation completed',
      data: result,
    };
  }

  @Post(':id/participants')
  async addParticipants(
    @Param('id', ParseIntPipe) id: number,
    @Body() addParticipantsDto: AddParticipantsDto,
  ): Promise<ApiResponse<ConversationResponseDto>> {
    const conversation = await this.conversationsService.addParticipants(
      id,
      addParticipantsDto,
    );
    return {
      message: 'Participants added successfully',
      data: conversation,
    };
  }

  @Delete(':id/participants')
  async removeParticipants(
    @Param('id', ParseIntPipe) id: number,
    @Body() removeParticipantsDto: RemoveParticipantsDto,
  ): Promise<ApiResponse<ConversationResponseDto>> {
    const conversation = await this.conversationsService.removeParticipants(
      id,
      removeParticipantsDto,
    );
    return {
      message: 'Participants removed successfully',
      data: conversation,
    };
  }

  @Get(':id/participants')
  async getParticipants(@Param('id', ParseIntPipe) id: number): Promise<
    ApiResponse<{
      customers: any[];
      users: any[];
    }>
  > {
    const participants = await this.conversationsService.getParticipants(id);
    return {
      message: 'Participants retrieved successfully',
      data: participants,
    };
  }

  // Add a test endpoint without auth to verify Swagger works
  @Get('test/public')
  @ApiOperation({ summary: 'Public test endpoint - no auth required' })
  @ApiResponse({ status: 200, description: 'Test successful' })
  // Remove @ApiBearerAuth() and @UseGuards() for this endpoint
  async testPublic() {
    return {
      message: 'Public endpoint working',
      timestamp: new Date().toISOString(),
    };
  }
}

@Controller('auth')
export class AuthController {
  @Post('test-token')
  @ApiOperation({ summary: 'Generate test JWT token for development' })
  @ApiResponse({ status: 200, description: 'Test token generated' })
  generateTestToken() {
    const payload = {
      shop_id: '0f2faa9a-2eda-4b32-81ee-e6bdb7d36fe3',
      user_id: 1,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
      algorithm: (process.env.JWT_ALGORITHM || 'HS256') as jwt.Algorithm,
    });

    return {
      access_token: token,
      token_type: 'bearer',
      expires_in: 86400,
    };
  }
}
