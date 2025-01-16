import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  //   @HttpCode(200)
  //   async getMessages() {
  //     return this.chatService.getMessages();
  //   }
  @HttpCode(201)
  @Post('/')
  async createMessage(@Body() input: { content: string }) {
    return {
      message: 'Message created successfully',
      data: await this.chatService.chat(input.content),
    };
  }
}
