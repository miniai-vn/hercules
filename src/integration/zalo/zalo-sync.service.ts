import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChannelsService } from 'src/channels/channels.service';
import { ChannelType } from 'src/channels/dto/channel.dto';
import { ZaloService } from './zalo.service';

@Injectable()
export class ZaloSyncService {
  constructor(
    private readonly channelService: ChannelsService,
    private readonly zaloService: ZaloService,
  ) {}
  @Cron(CronExpression.EVERY_HOUR)
  async checkAndRefreshTokens(): Promise<void> {
    const zaloChannels = await this.channelService.findByType(ChannelType.ZALO);
    if (!zaloChannels || zaloChannels.length === 0) {
      return;
    }

    for (const channel of zaloChannels) {
      if (this.zaloService.needsTokenRefresh(channel)) {
        await this.zaloService.refreshAccessToken(channel);
      }
    }
  }
}
