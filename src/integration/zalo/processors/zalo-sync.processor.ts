import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ZaloService } from '../zalo.service';
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
        case 'first-time-sync':
          await this.zaloService.fetchMessagesWithinCustomTime(
            appId,
            3,
            'month',
            50,
          );

          break;
        case 'sync-daily-zalo-conversations':
          await this.zaloService.fetchMessagesWithinCustomTime(
            appId,
            1,
            'day',
            null,
          );

        case 'sync-zalo-conversations-with-user':
          await this.zaloService.handleSyncConversationsWithUserId(
            userId,
            appId,
            messageCount,
          );
          break;

        case 'sync-zalo-custom-time':
          await this.zaloService.getAllUsers(appId);
        default:
          console.warn(`Unknown job name: ${job.name}`);
      }
    } catch (error) {
      throw error; // Rethrow to mark the job as failed
    }
  }
}
