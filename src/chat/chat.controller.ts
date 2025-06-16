import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

import { ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @EventPattern(process.env.KAFKA_ZALO_MESSAGE_CONSUMER)
  async sendMessage(@Payload() data: any) {
    console.log('Received message from Zalo:', data);
    this.chatService.sendMessagesZaloToPlatform(data);
    return {
      status: 'success',
      message: 'Authenticated message sent successfully',
    };
  }
}
