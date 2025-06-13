import { FacebookService } from './facebook.service';
import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('Facebook')
@Controller('facebook')
export class FacebookController {
  constructor(private readonly FacebookService: FacebookService) {}

  @Get('connect')
  connectToFacebook(@Res() res: any) {
    return this.FacebookService.connectToFacebook(res);
  }

  @Get('callback')
  async handleFacebookCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.FacebookService.callbackFacebook(code, state);
      console.log(` result:: `, result);

      const firstPage = result.tokenPage?.[0];
      // if (!firstPage) {
      //   return res.redirect(`http://localhost:3000/error?reason=no-page`);
      // }

      const redirectUrl = `http://localhost:3000/dashboard/channels?type=facebook&appId=${firstPage.id}`;
      return res.redirect(redirectUrl);
    } catch (error) {}
  }

  // @Get('/access-token-page/:userToken')
  // async getPageAccessToken(@Param('userToken') userToken: string) {
  //   return this.FacebookService.getPageAccessToken(userToken);
  // }

  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
  ) {
    return this.FacebookService.verifyWebhook(mode, verifyToken, challenge);
  }

  // 2. Endpoint để nhận POST event sau khi đã verify
  @Post('webhook')
  async receiveWebhook(@Body() body: any): Promise<any> {
    if (body.object === 'page') {
      for (const entry of body.entry) {
        console.log(`Received entry for page ${entry.id} at ${entry.time}`);
        for (const event of entry.messaging) {
          // trong controller, trước khi xử lý
          console.log('Full event:', JSON.stringify(event, null, 2));

          // Tin nhắn văn bản
          if (event.message?.text) {
            await this.FacebookService.handleMessage(event);
          }
          // // Postback (nhấn nút)
          // else if (event.postback) {
          //   await this.FacebookService.handlePostback(event);
          // } else {
          console.log('Unknown event type:', JSON.stringify(event));
        }
      }
    }
    // Trả về đúng chuỗi để Facebook coi là đã nhận
    return 'EVENT_RECEIVED';
  }

  @Get('/:page_id/conversations/')
  async getIdConversations(
    @Query('acces_token_page') access_token_page: string,
    @Param('page_id') page_id: string,
  ): Promise<string> {
    return await this.FacebookService.getIdConversations(
      access_token_page,
      page_id,
    );
  }

  async getPSID(): Promise<string> {
    return null;
  }
}
