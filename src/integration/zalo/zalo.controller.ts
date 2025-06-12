import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { join } from 'path';
import { ZaloService } from './zalo.service';

@ApiTags('Integration')
@Controller('integration')
export class ZaloController {
  constructor(private readonly zaloService: ZaloService) {}

  @Get('zalo')
  @ApiOperation({ summary: 'Zalo webhook verification' })
  @ApiResponse({ status: 200, description: 'Webhook verification file' })
  async zaloWebhookHandler(@Res() res: Response) {
    console.log('Zalo webhook verification requested');
    // Fix the file path - use forward slashes and relative path
    const filePath = join(
      process.cwd(),
      'public',
      'zalo_verifierGkRa5O6GTXL3ukCJdz5WJa_upMgZZXipCp0u.html',
    );
    console.log('File path:', filePath);
    return res.sendFile(filePath);
  }

  @Get('zalo/webhook/handler')
  @ApiOperation({ summary: 'Zalo webhook handler' })
  @ApiResponse({ status: 200, description: 'Webhook handler response' })
  async zaloWebhookHandlerPost(@Query() query: any) {
    await this.zaloService.getAccessToken(query.oa_id, query.code);
    return {
      status: 'success',
      message: 'Webhook handler called',
      query: query,
    };
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
