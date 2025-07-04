import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt-auth.guard';
import { FacebookEventDTO } from 'src/integration/facebook/dto/facebook-webhook.dto';
import { ChatService, SendMessageData } from './chat.service';
import { ZaloWebhookDto } from './dto/chat-zalo.dto';

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
      return {
        status: 'success',
        message: 'Message sent to Zalo successfully',
        data: await this.chatService.sendMessagePlatformToOmniChannel({
          ...data,
          userId: req.user.userId,
        }),
      };
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  async sendMessageFacebookToPlatform(@Body() data: FacebookEventDTO) {
    await this.chatService.sendMessagesFacebookToPlatform(data);
    return {
      status: 'success',
      message: 'Message sent to Facebook successfully',
    };
  }
}
