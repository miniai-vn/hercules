import { FacebookService } from './facebook.service';
import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { FacebookWebhookDTO } from './dto/facebook-webhook.dto';
@ApiTags('Facebook')
@Controller('facebook')
export class FacebookController {
  constructor(private readonly facebookService: FacebookService) {}

  @Get('connect')
  connectToFacebook(@Res() res: any) {
    return this.facebookService.connectToFacebook(res);
  }

  @Get('callback')
  async handleFacebookCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.facebookService.callbackFacebook(code, state);

      const firstPage = result.tokenPage?.[0];
      if (!firstPage) {
        return res.redirect(`http://localhost:3000/error?reason=no-page`);
      }

      const redirectUrl = `http://localhost:3000/dashboard/channels?type=facebook&appId=${firstPage.id}`;
      return res.redirect(redirectUrl);
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
  async receiveWebhook(@Body() body: FacebookWebhookDTO): Promise<any> {
    if (body.object === 'page') {
      for (const entry of body.entry ?? []) {
        console.log(`Received entry for page ${entry.id} at ${entry.time}`);
        for (const event of entry.messaging) {
          if (event.message?.text) {
            await this.facebookService?.handleMessage(event);
          }
          // Postback (nhấn nút)
          else if (event.postback) {
            await this.facebookService?.handlePostback(event);
          }
          console.log('Unknown event type:', JSON.stringify(event));
        }
      }
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Webhook received and processed',
    };
  }

  @Get('/:page_id/conversations/')
  async getIdConversations(
    @Query('acces_token_page') access_token_page: string,
    @Param('page_id') page_id: string,
  ): Promise<string> {
    return await this.facebookService.getIdConversations(
      access_token_page,
      page_id,
    );
  }

  // async getPSID(): Promise<string> {
  //   return null;
  // }
}
