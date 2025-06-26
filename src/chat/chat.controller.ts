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

  @Post('/send-message-facebook-to-platform')
  async sendMessageFacebookToPlatform(@Req() req) {
    await this.chatService.sendMessagesFacebookToPlatform(req.body);
    return {
      status: 'success',
      message: 'Message sent to Facebook successfully',
    };
  }

  @Post('/sms-facebook')
  @ApiBearerAuth('bearerAuth')
  @UseGuards(JwtAuthGuard)
  async sendMessagePlatformToFacebook(
    @Req() req,
    @Payload() data: SendMessageData,
  ) {
    try {
      await this.chatService.sendMessagePlatformToFacebook({
        ...data,
        userId: req.user.userId, // Lấy userId từ token đã decode
      });
      return {
        status: 'success',
        message: 'Message sent to Facebook successfully',
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Failed to send message: ${error.message}`,
      };
    }
  }
}
