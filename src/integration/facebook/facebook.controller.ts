import { FacebookService } from './facebook.service';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FacebookWebhookDTO } from './dto/facebook-webhook.dto';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@ApiTags('Facebook')
@Controller('facebook')
export class FacebookController {
  constructor(
    private readonly facebookService: FacebookService,
    @InjectQueue(process.env.REDIS_FACEBOOK_SYNC_TOPIC)
    private readonly facebookSyncQueue: Queue,
  ) {}

  @Get('connect')
  async connectToFacebook(@Res() res: Response) {
    const url = await this.facebookService.connectToFacebook();
    return res.redirect(url);
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
  @ApiOperation({ summary: 'Facebook webhook verification' })
  @ApiQuery({
    name: 'hub.mode',
    required: true,
    type: String,
    description: 'The mode value for verification, usually "subscribe"',
    example: 'subscribe',
  })
  @ApiQuery({
    name: 'hub.verify_token',
    required: true,
    type: String,
    description: 'Token to verify the webhook endpoint',
  })
  @ApiQuery({
    name: 'hub.challenge',
    required: true,
    type: String,
    description: 'Challenge code to be echoed back',
    example: '9999',
  })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const result = this.facebookService.verifyWebhook(
      mode,
      verifyToken,
      challenge,
    );
    if (result) {
      return res.status(200).send(result);
    }
    return res.status(403).send('Forbidden');
  }

  @Post('webhook')
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

  @Post('sync-conversations/:pageId')
  @ApiOperation({ summary: 'Sync Facebook conversations' })
  @ApiResponse({
    status: 200,
    description: 'Conversations synced successfully',
  })
  async syncFacebookConversations(@Param('pageId') pageId: string) {
    if (!pageId) {
      throw new Error('Page ID is required');
    }

    const job = await this.facebookSyncQueue.add('first-time-sync', {
      pageId: pageId,
    });

    const schedulerId = `sync-conversations-${pageId}`;

    this.facebookSyncQueue.upsertJobScheduler(
      schedulerId,
      {
        every: 24 * 60 * 60 * 1000,
        startDate: new Date(Date.now() + 10 * 60 * 1000),
      },
      {
        name: 'sync-daily-facebook-conversations',
        data: {
          pageId,
        },
      },
    );
    return {
      message: 'Conversations synced successfully',
      data: job,
    };
  }
}
