import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt-auth.guard'; // Adjust path
import {
  CreateMessageDto,
  MessageBulkDeleteDto,
  MessageQueryParamsDto,
  UpdateMessageDto,
} from './dto/messages.dto';
import { MessagesService } from './messages.service';

interface ApiResponse<T> {
  message: string;
  data?: T;
}

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}
  @Get('/context')
  @HttpCode(HttpStatus.OK)
  async getContext(
    @Query('conversationId', ParseIntPipe) conversationId: number,
    @Query('messageId', ParseIntPipe) messageId: number,
  ) {
    try {
      const context = await this.messagesService.getContextMessages(
        conversationId,
        messageId,
      );
      return {
        message: 'Context retrieved successfully',
        data: context,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve context');
    }
  }

  @Get('/query')
  @HttpCode(HttpStatus.OK)
  async query(@Query() queryParams: MessageQueryParamsDto) {
    try {
      return await this.messagesService.query(queryParams);
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve messages');
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createMessageDto: CreateMessageDto) {
    // const message = await this.messagesService.create(createMessageDto);
    return {
      message: 'Message created successfully',
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMessageDto: UpdateMessageDto,
  ) {
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

  @Patch(':id/restore')
  async restoreOne(@Param('id', ParseIntPipe) id: number) {
    const message = await this.messagesService.restoreOne(id);
    return {
      message: 'Message restored successfully',
      data: message,
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
