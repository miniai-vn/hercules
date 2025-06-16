import {
  Body,
  Controller,
  Get,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { join } from 'path';
import { ZaloService } from './zalo.service';
import { ZaloWebhookDto } from './dto/zalo-webhook.dto';

@ApiTags('Integration')
@Controller('integration')
export class ZaloController {
  constructor(private readonly zaloService: ZaloService) {}

  @Get('zalo')
  @ApiOperation({ summary: 'Zalo webhook verification' })
  @ApiResponse({ status: 200, description: 'Webhook verification file' })
  async zaloWebhookHandler(@Res() res: Response) {
    const filePath = join(
      process.cwd(),
      'public',
      'zalo_verifierGkRa5O6GTXL3ukCJdz5WJa_upMgZZXipCp0u.html',
    );
    return res.sendFile(filePath);
  }

  @Get('zalo/webhook/handler')
  @ApiOperation({ summary: 'Zalo webhook handler' })
  @ApiResponse({ status: 302, description: 'Redirect to dashboard' })
  async zaloWebhookHandlerPost(@Query() query: any, @Res() res: Response) {
    try {
      const url = await this.zaloService.getAccessToken(
        query.oa_id,
        query.code,
      );

      // Redirect to the URL returned by the service
      return res.redirect(url);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to handle Zalo webhook',
        error.message,
      );
    }
  }
  @Post('zalo/webhook/receive')
  @ApiOperation({ summary: 'Receive Zalo webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook event received' })
  async receiveZaloWebhook(@Res() res: Response, @Body() body: ZaloWebhookDto) {
    try {
      res.status(HttpStatus.OK).json({});
      await this.zaloService.handleWebhook(body);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to process Zalo webhook',
        error.message,
      );
    }
  }

  //    @Get("authorize-tiktok")
  //     async authorizeTikTok() {
  //         return this.integrationService.authorizeTikTok();
  //     }

  //     @Get("tiktok/conversations")
  //     async getConversations() {
  //         return this.integrationService.getConversations();
  //     }

  //     @Get("tiktok/shop-info")
  //     async getShopInfo() {
  //         return this.integrationService.getAuthorizeShop();
  //     }

  //     @Get("tiktok/products")
  //     async getProducts() {
  //         return this.integrationService.getProducts();
  //     }
}
