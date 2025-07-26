import {
  Body,
  Controller,
  Get,
  HttpStatus,
  InternalServerErrorException,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
    // Fix the file path - use forward slashes and relative path
    const filePath = join(
      process.cwd(),
      'public',
      'zalo_verifierFiE4T-VJBa0LsvnKxkqtMpZdfdRKaN0XC30m.html',
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

      return res.redirect(url);
    } catch (error) {
      throw new Error(`Error processing Zalo webhook: ${error.message}`);
    }
  }
  @Post('zalo/webhook/receive')
  @ApiBody({
    description: 'Zalo webhook event data',
    type: Object,
  })
  @ApiOperation({ summary: 'Receive Zalo webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook event received' })
  async receiveZaloWebhook(
    @Query() query: any,
    @Res() res: Response,
    @Body() body,
  ) {
    try {
      res.status(HttpStatus.OK).json({});
      await this.zaloService.handleWebhook(body);
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  @Post('zalo/sync-conversations/:appId')
  @ApiOperation({ summary: 'Sync Zalo conversations' })
  @ApiResponse({
    status: 200,
    description: 'Conversations synced successfully',
  })
  async syncDataAppZalo(@Param('appId') appId: string) {
    try {
      return {
        message: 'Conversations synced successfully',
        data: await this.zaloService.syncDataAppId(appId),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Error syncing Zalo conversations: ${error.message}`,
      );
    }
  }
}
