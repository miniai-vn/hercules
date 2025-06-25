import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatService, SendMessageData } from './chat.service';
import { ZaloWebhookDto } from './dto/chat-zalo.dto';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt-auth.guard';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // @EventPattern(process.env.KAFKA_ZALO_MESSAGE_CONSUMER)
  // @Post('/zalo-webhook')
  // @ApiOperation({
  //   summary: 'Handle Zalo webhook messages',
  //   description: 'Receive messages from Zalo and process them.',
  // })
  // @ApiBody({
  //   description: 'Zalo webhook message data',
  //   type: Object,
  // })
  async sendMessage(@Payload() data: ZaloWebhookDto) {
    try {
      this.chatService.sendMessagesZaloToPlatform(data);
      return {
        status: 'success',
        message: 'Authenticated message sent successfully',
      };
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  @Post('/sms')
  @ApiBearerAuth('bearerAuth')
  @UseGuards(JwtAuthGuard)
  async sendMessagePlatformToZalo(
    @Req() req,
    @Payload() data: SendMessageData,
  ) {
    try {
      return await this.chatService.sendMessagePlatformToZalo({
        ...data,
        userId: req.user.userId,
      });
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }
}
