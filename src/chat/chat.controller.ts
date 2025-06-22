import { Controller, Post, Req } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatService, SendMessageData } from './chat.service';
import { ZaloWebhookDto } from './dto/chat-zalo.dto';

@ApiTags('chat')
@Controller('chat')
@ApiBearerAuth('bearerAuth')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @EventPattern(process.env.KAFKA_ZALO_MESSAGE_CONSUMER)
  @Post('/zalo-webhook')
  @ApiOperation({
    summary: 'Handle Zalo webhook messages',
    description: 'Receive messages from Zalo and process them.',
  })
  @ApiBody({
    description: 'Zalo webhook message data',
    type: Object,
  })
  async sendMessage(@Payload() data: ZaloWebhookDto) {
    this.chatService.sendMessagesZaloToPlatform(data);
    return {
      status: 'success',
      message: 'Authenticated message sent successfully',
    };
  }

  @Post('/send-message-platform-to-zalo')
  async sendMessagePlatformToZalo(
    @Req() req,
    @Payload() data: SendMessageData,
  ) {
    await this.chatService.sendMessagePlatformToZalo({
      conversationId: data.conversationId,
      message: data.message,
      userId: data.userId,
      messageType: data.messageType,
      shopId: data.shopId,
    });
    return {
      status: 'success',
      message: 'Message sent to Zalo successfully',
    };
  }
}
