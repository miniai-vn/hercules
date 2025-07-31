import {
  Body,
  Controller,
  Post,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Payload } from '@nestjs/microservices';

import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt-auth.guard';
import { ChatService } from './chat.service';
import { ZaloWebhookDto } from './dto/chat-zalo.dto';
import { SendMessageData } from './dto/send-message.dto';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  async sendMessage(@Payload() data: ZaloWebhookDto) {
    try {
      this.chatService.handleZaloMessage(data);
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
        data: await this.chatService.handleSendPlatformMessage({
          ...data,
          userId: req.user.userId,
          shopId: req.shop.id,
        }),
      };
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  @Post('/attachment')
  @ApiBearerAuth('bearerAuth')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async sendAttachment(
    @Req() req,
    @Body() data,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      const result = await this.chatService.handleAttachmentMessage({
        ...data,
        userId: req.user.id,
        file,
      });
      return {
        status: 'success',
        message: 'Attachment sent to Zalo successfully',
        data: result,
      };
    } catch (error) {
      throw new Error(`Failed to send attachment: ${error.message}`);
    }
  }

  @Post('/images')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 10), // 10 là số lượng file tối đa
  )
  async sendImages(
    @Req() req,
    @Body() data,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    try {
      const result = await this.chatService.handleImageMessage({
        ...data,
        userId: req.user.id,
        files,
      });
      return {
        status: 'success',
        message: 'Images sent to Zalo successfully',
        data: result,
      };
    } catch (error) {
      throw new Error(`Failed to send images: ${error.message}`);
    }
  }
}
