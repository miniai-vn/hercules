import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
  Query,
  Patch,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Conversation } from './conversations.entity';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/auth.module'; // Adjust path
import {
  CreateConversationDto,
  UpdateConversationDto,
  ConversationQueryParamsDto,
  ConversationBulkDeleteDto,
  PaginatedConversationsDto,
  ConversationResponseDto,
  AddParticipantsDto,
  RemoveParticipantsDto,
} from './dto/conversation.dto';

interface ApiResponse<T> {
  message: string;
  data: T;
}

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
}
