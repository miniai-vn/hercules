import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/createMessage.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  @Get()
  @HttpCode(HttpStatus.OK)
  async get() {
    return {
      message: 'Success',
      data: await this.chatService.getMessages(),
    };
  }

  @Post('/send')
  @HttpCode(HttpStatus.OK)
  async send(@Body() input: CreateMessageDto) {
    return await this.chatService.sendChat(input);
  }
}
