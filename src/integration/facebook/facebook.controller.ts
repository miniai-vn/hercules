import { FacebookService } from './facebook.service';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FacebookWebhookDTO } from './dto/facebook-webhook.dto';

@ApiTags('Facebook')
@Controller('facebook')
export class FacebookController {
  constructor(private readonly facebookService: FacebookService) {}

  @Get('connect')
  async connectToFacebook(@Res() res: Response) {
    return await this.facebookService.connectToFacebook(res);
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

  @Get('/webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
  ) {
    return this.facebookService.verifyWebhook(mode, verifyToken, challenge);
  }

  // 2. Endpoint để nhận POST event sau khi đã verify
  @Post('webhook/receive')
  @ApiOperation({ summary: 'Receive Facebook webhook events' })
  @ApiResponse({
    status: 200,
    description: 'Webhook received and processed',
  })
  async receiveWebhook(@Body() body: FacebookWebhookDTO, @Res() res: Response) {
    try {
      res.status(HttpStatus.OK).json({
        success: true,
        timestamp: new Date().toISOString(),
        message: 'Webhook received and processed',
      });
      await this.facebookService.handleWebhook(body);
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  // @Get('/conversations')
  // async getIdsConversationsPage(
  //   @Query() query: TFacebookConversatioQueryDTO,
  //   // @Param('page_id') page_id: string,
  // ): Promise<TConversationPageId> {
  //   return await this.facebookService.getIdsConversationsPage(query);
  // }

  // @Get('/conversations/all')
  // async getIdsConversationsPageAll(): Promise<any> {
  //   return await this.facebookService.getIdsConversationsPageAll();
  // }

  // @Get('/message/:id/messages-detail')
  // async getMessage(
  //   @Query() query: FacebookMessageQueryDTO,
  // ): Promise<TFacebookMessage> {
  //   return await this.facebookService.getMessageDetail(query);
  // }

  // @Get('/:psid')
  // async getUserProfile(
  //   @Query() query: FacebookUserProfileQueryDTO,
  // ): Promise<void> {
  //   return await this.facebookService.getUserProfile(query);
  // }
}
