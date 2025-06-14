import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChannelsService } from 'src/channels/channels.service';
import { KafkaService } from 'src/kafka/kafka.service';
import { ChannelType } from 'src/channels/dto/channel.dto';
import { ZaloService } from './zalo.service';

@Injectable()
export class ZaloSyncService {
  private readonly logger = new Logger(ZaloSyncService.name);
  private readonly topic = process.env.KAFKA_ZALO_SYNC_TOPIC;

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

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async syncAllZaloChannels() {
    const zaloChannels = await this.channelService.findByType(ChannelType.ZALO);
    for (const channel of zaloChannels) {
      try {
        const lastSyncState = await this.channelService.getChannelSyncState(
          channel.id,
        );

        if (this.checkLastSync(lastSyncState.lastSyncedAt)) {
          this.zaloService.getListUser({
            accessToken: channel.accessToken,
            count: 50,
            offset: lastSyncState.lastOffset,
          });
          await this.delay(1000);
        }
      } catch (error) {
        this.logger.error(
          `Failed to sync Zalo channel ${channel.id}: ${error.message}`,
        );
      }
    }
  }

  async checkLastSync(lastSyncAt: Date) {
    const now = new Date();
    const aHoursFromNow = new Date(now.getTime() + 1 * 60 * 60 * 1000);
    return lastSyncAt < aHoursFromNow;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
