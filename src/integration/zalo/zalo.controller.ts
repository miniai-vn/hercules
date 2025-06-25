import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { join } from 'path';
import { ZaloService } from './zalo.service';
import { ZaloWebhookDto } from './dto/zalo-webhook.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { delay, Queue } from 'bullmq';

@ApiTags('Integration')
@Controller('integration')
export class ZaloController {
  constructor(
    private readonly zaloService: ZaloService,
    @InjectQueue('zalo-sync') private readonly zaloSyncQueue: Queue,
  ) {}

  @Get('zalo')
  @ApiOperation({ summary: 'Zalo webhook verification' })
  @ApiResponse({ status: 200, description: 'Webhook verification file' })
  async zaloWebhookHandler(@Res() res: Response) {
    // Fix the file path - use forward slashes and relative path
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

      return res.redirect(url);
    } catch (error) {
      throw new Error(`Error processing Zalo webhook: ${error.message}`);
    }
  }
  @Post('zalo/webhook/receive')
  @ApiOperation({ summary: 'Receive Zalo webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook event received' })
  async receiveZaloWebhook(
    @Query() query: any,
    @Res() res: Response,
    @Body() body: ZaloWebhookDto,
  ) {
    try {
      res.status(HttpStatus.OK).json({});
      await this.zaloService.handleWebhook(body);
    } catch (error) {
      console.error('Error processing webhook event:', error);
      return { status: 'error', message: error.message };
    }
  }

  @Post('zalo/sync-conversations/:channelId')
  @ApiOperation({ summary: 'Sync Zalo conversations' })
  @ApiParam({
    name: 'channelId',
    description: 'Channel ID to sync conversations for',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversations synced successfully',
  })
  async syncZaloConversations(
    @Param('channelId', ParseIntPipe) channelId: number,
  ) {
    const job = await this.zaloSyncQueue.add('first-time-sync', {
      channelId: channelId,
    });

    const schedulerId = `sync-conversations-${channelId}`;
    await this.zaloSyncQueue.removeJobScheduler(schedulerId);
    await this.zaloSyncQueue.upsertJobScheduler(
      schedulerId,
      {
        every: 24 * 60 * 60 * 1000,
        startDate: new Date(Date.now() + 60 * 60 * 1000),
      },
      {
        name: 'sync-daily-zalo-conversations',
        data: {
          channelId,
        },
      },
    );
    return {
      message: 'Conversations synced successfully',
      data: job.id,
    };
  }
}
