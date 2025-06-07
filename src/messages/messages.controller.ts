import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.module'; // Adjust path
import {
  BulkCreateMessagesDto,
  CreateMessageDto,
  MessageBulkDeleteDto,
  MessageQueryParamsDto,
  MessageResponseDto,
  MessageStatsDto,
  PaginatedMessagesDto,
  RestoreMessageDto,
  UpdateMessageDto,
} from './messages.dto';
import { MessagesService } from './messages.service';

interface ApiResponse<T> {
  message: string;
  data?: T;
}

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<ApiResponse<MessageResponseDto>> {
    const message = await this.messagesService.create(createMessageDto);
    return {
      message: 'Message created successfully',
      data: message,
    };
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  async bulkCreate(
    @Body() bulkCreateDto: BulkCreateMessagesDto,
  ): Promise<ApiResponse<MessageResponseDto[]>> {
    const messages = await this.messagesService.bulkCreate(bulkCreateDto);
    return {
      message: 'Messages created successfully',
      data: messages,
    };
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search', new DefaultValuePipe('')) search: string,
    @Query('includeDeleted', new DefaultValuePipe(false), ParseBoolPipe)
    includeDeleted: boolean,
  ): Promise<ApiResponse<PaginatedMessagesDto>> {
    const messages = await this.messagesService.findAll(
      page,
      limit,
      search,
      includeDeleted,
    );
    return {
      message: 'Messages retrieved successfully',
      data: messages,
    };
  }

  @Get('query')
  async query(
    @Query() queryParams: MessageQueryParamsDto,
  ): Promise<ApiResponse<MessageResponseDto[]>> {
    const messages = await this.messagesService.query(queryParams);
    return {
      message: 'Messages queried successfully',
      data: messages,
    };
  }

  @Get('stats')
  async getStats(): Promise<ApiResponse<MessageStatsDto>> {
    const stats = await this.messagesService.getStats();
    return {
      message: 'Message statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('conversation/:conversationId')
  async findByConversation(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('includeDeleted', new DefaultValuePipe(false), ParseBoolPipe)
    includeDeleted: boolean,
  ): Promise<ApiResponse<PaginatedMessagesDto>> {
    const messages = await this.messagesService.findByConversation(
      conversationId,
      page,
      limit,
      includeDeleted,
    );
    return {
      message: 'Conversation messages retrieved successfully',
      data: messages,
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMessageDto: UpdateMessageDto,
  ): Promise<ApiResponse<MessageResponseDto>> {
    const message = await this.messagesService.update(id, updateMessageDto);
    return {
      message: 'Message updated successfully',
      data: message,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<{ id: number }>> {
    await this.messagesService.remove(id);
    return {
      message: 'Message deleted successfully',
      data: { id },
    };
  }

  @Delete(':id/permanent')
  @HttpCode(HttpStatus.OK)
  async permanentDelete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<{ id: number }>> {
    await this.messagesService.permanentDelete(id);
    return {
      message: 'Message permanently deleted',
      data: { id },
    };
  }

  @Post('bulk-delete')
  async bulkDelete(@Body() bulkDeleteDto: MessageBulkDeleteDto): Promise<
    ApiResponse<{
      totalRequested: number;
      deletedCount: number;
      notFoundCount: number;
    }>
  > {
    const result = await this.messagesService.bulkDelete(bulkDeleteDto);
    return {
      message: 'Bulk delete operation completed',
      data: result,
    };
  }

  @Post('restore')
  async restore(@Body() restoreDto: RestoreMessageDto): Promise<
    ApiResponse<{
      totalRequested: number;
      restoredCount: number;
      notFoundCount: number;
    }>
  > {
    const result = await this.messagesService.restore(restoreDto);
    return {
      message: 'Messages restored successfully',
      data: result,
    };
  }

  @Patch(':id/restore')
  async restoreOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<MessageResponseDto>> {
    const message = await this.messagesService.restoreOne(id);
    return {
      message: 'Message restored successfully',
      data: message,
    };
  }

  @Get('conversation/:conversationId/stats')
  async getConversationStats(
    @Param('conversationId', ParseIntPipe) conversationId: number,
  ): Promise<ApiResponse<MessageStatsDto>> {
    const stats =
      await this.messagesService.getConversationStats(conversationId);
    return {
      message: 'Conversation message statistics retrieved successfully',
      data: stats,
    };
  }

  @Delete('conversation/:conversationId')
  @HttpCode(HttpStatus.OK)
  async deleteAllInConversation(
    @Param('conversationId', ParseIntPipe) conversationId: number,
  ): Promise<ApiResponse<{ deletedCount: number }>> {
    const result =
      await this.messagesService.deleteAllInConversation(conversationId);
    return {
      message: 'All messages in conversation deleted successfully',
      data: result,
    };
  }

  
}
