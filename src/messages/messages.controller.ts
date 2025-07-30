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
}
