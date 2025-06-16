import { Body, Controller, InternalServerErrorException } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

import { ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatPlatformDto } from './dto/chat-platform.dto';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @EventPattern(process.env.KAFKA_ZALO_MESSAGE_TOPIC)
  async sendMessage(@Payload() data: any) {
    try {
      this.chatService.sendMessagesZaloToPlatform(data);
      return {
        status: 'success',
        message: 'Authenticated message sent successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to send message to platform',
        error.message,
      );
    }
  }

  async sendMessagePlatformToZalo(@Body() data: ChatPlatformDto) {
    try {
      this.chatService.sendMessagePlatformToZalo(data);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to send message to Zalo',
        error.message,
      );
    }
  }
}
