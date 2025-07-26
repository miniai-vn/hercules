import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ZaloService } from '../zalo.service';
import { ZaloJobEvent } from 'src/common/enums/job-event.enum';
@Processor(process.env.REDIS_ZALO_SYNC_TOPIC, {
  concurrency: 50,
})
export class ZaloSyncProcessor extends WorkerHost {
  constructor(private readonly zaloService: ZaloService) {
    super();
  }

  async process(job: Job) {
    const { appId, userId, messageCount } = job.data;
    try {
      switch (job.name) {
        case ZaloJobEvent.FIRST_TIME_SYNC:
          await this.zaloService.fetchMessagesWithinCustomTime(
            appId,
            3,
            'month',
            50,
          );

          break;
        case ZaloJobEvent.SYNC_DAILY_CONVERSATIONS:
          await this.zaloService.fetchMessagesWithinCustomTime(
            appId,
            1,
            'day',
            null,
          );

        case ZaloJobEvent.SYNC_CONVERSATIONS_WITH_USER:
          await this.zaloService.handleSyncConversationsByUserId(
            userId,
            appId,
            messageCount,
          );
          break;

        case ZaloJobEvent.SYNC_CUSTOM_TIME:
          await this.zaloService.getAllUsers(appId);
        default:
          console.warn(`Unknown job name: ${job.name}`);
      }
    } catch (error) {
      throw error; // Rethrow to mark the job as failed
    }
  }
}
