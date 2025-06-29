import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response, Request } from 'express';
import { LazadaWebhookDto } from './dto/lazada-webhook.dto';
import { LazadaService } from './lazada.service';
import * as crypto from 'crypto';
import axios from 'axios';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
@ApiTags('Integration')
@Controller('integration/lazada')
export class LazadaController {
  constructor(
    private readonly lazadaService: LazadaService,
    @InjectQueue(process.env.REDIS_LAZADA_SYNC_TOPIC)
    private readonly lazadaSyncQueue: Queue,
  ) {}

  @Get('auth')
  @ApiOperation({ summary: 'Lazada OAuth authorization handler' })
  @ApiQuery({ name: 'code', description: 'Authorization code from Lazada' })
  @ApiQuery({ name: 'app_key', description: 'Lazada app key' })
  @ApiResponse({ status: 302, description: 'Redirect to dashboard' })
  async lazadaAuthHandler(@Query('code') code: string, @Res() res: Response) {
    const url = await this.lazadaService.auth(code);
    return res.redirect(url);
  }

  @Post('webhook/receive')
  @ApiOperation({ summary: 'Receive Lazada webhook events' })
  @ApiBody({ type: LazadaWebhookDto })
  @ApiResponse({ status: 200, description: 'Webhook event received' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async receiveLazadaWebhook(
    @Body() body: LazadaWebhookDto,
    @Headers('x-lazada-signature') signature: string,
    @Res() res: Response,
  ) {
    try {
      // Verify webhook signature if provided
      if (signature) {
        const webhookSecret = process.env.LAZADA_WEBHOOK_SECRET;
        const isValid = this.lazadaService.verifyWebhookSignature(
          JSON.stringify(body),
          signature,
          webhookSecret,
        );

        if (!isValid) {
          return res.status(HttpStatus.UNAUTHORIZED).json({
            error: 'Invalid webhook signature',
          });
        }
      }

      res.status(HttpStatus.OK).json({ status: 'received' });

      await this.lazadaService.handleWebhook(body);
    } catch (error) {
      console.error('Lazada webhook error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to process webhook',
        message: error.message,
      });
    }
  }

  @Post('sync-conversations/:appId')
  @ApiOperation({
    summary: 'Sync Lazada conversations for a specific app',
  })
  @ApiParam({
    name: 'appId',
    description: 'Lazada app ID to sync conversations for',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversations sync initiated successfully',
  })
  async syncLazadaConversations(@Param('appId') appId: string) {
    try {
      if (!appId) {
        throw new BadRequestException('App ID is required');
      }

      this.lazadaSyncQueue.add('first-time-sync', {
        appId: appId,
      });

      const schedulerId = `sync-conversations-${appId}`;
      this.lazadaSyncQueue.upsertJobScheduler(
        schedulerId,
        {
          every: 24 * 60 * 60 * 1000,
          startDate: new Date(Date.now() + 10 * 60 * 1000),
        },
        {
          name: 'sync-daily-lazada-conversations',
          data: {
            appId,
          },
        },
      );

      return {
        message: 'Conversations sync initiated successfully',
      };
    } catch (error) {
      throw new BadRequestException({
        error: 'Failed to sync conversations',
        message: error.message,
      });
    }
  }
}
