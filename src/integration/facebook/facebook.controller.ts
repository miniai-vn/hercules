import { FacebookService } from './facebook.service';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { FacebookWebhookDTO } from './dto/facebook-webhook.dto';
import { TConversationPageId } from './types/conversation.type';
@ApiTags('Facebook')
@Controller('facebook')
export class FacebookController {
  constructor(private readonly facebookService: FacebookService) {}

  @Get('connect')
  connectToFacebook(@Res() res: Response) {
    return this.facebookService.connectToFacebook(res);
  }

  @Get('callback')
  async handleFacebookCallback(
    @Query('code') code: string,
    @Res() res: Response,
  ) {
    try {
      const url = await this.facebookService.callbackFacebook(code);
      return res.redirect(url);
    } catch (error) {}
  }

  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
  ) {
    return this.facebookService.verifyWebhook(mode, verifyToken, challenge);
  }

  // 2. Endpoint để nhận POST event sau khi đã verify
  @Post('webhook/handler')
  async receiveWebhook(@Body() body: FacebookWebhookDTO) {
    if (body.object === 'page') {
      for (const entry of body.entry ?? []) {
        for (const event of entry.messaging) {
          if (event.message?.text) {
            await this.facebookService?.handleMessage(event);
          } else if (event.postback) {
            await this.facebookService?.handlePostback(event);
          }
        }
      }
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Webhook received and processed',
    };
  }

  @Get('/page/:page_id/conversations')
  async getIdsConversationsPage(
    @Query('acces_token_page') access_token_page: string,
    @Param('page_id') page_id: string,
  ): Promise<TConversationPageId> {
    return await this.facebookService.getIdsConversationsPage(
      access_token_page,
      page_id,
    );
  }

  @Get('/:id/messages-detail')
  async getMessage(
    @Query('access_token_page') access_token_page: string,
    @Query('fields') fields: string,
  ): Promise<string> {
    return null;
  }
}
