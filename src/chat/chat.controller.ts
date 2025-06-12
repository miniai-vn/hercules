import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ZaloWebhookDto } from './dto/chat-zalo.dto';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Protected endpoints - REQUIRE AUTH
  @Post('send-message')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({
    summary: 'Send message (authenticated)',
    description: 'Send message to conversation (requires authentication)',
  })
  @ApiResponse({
    status: 200,
    description: 'Message sent successfully',
  })
  @ApiBody({
    description: 'Message data',
    type: ZaloWebhookDto,
  })
  async sendMessage(@Body() data: ZaloWebhookDto) {
    // Implementation for authenticated message sending
    const response = await this.chatService.sendMessages(data);
    return {
      status: 'success',
      message: 'Authenticated message sent successfully',
    };
  }
}
