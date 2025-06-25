import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ZaloService } from '../zalo.service';
@Processor('zalo-sync')
export class ZaloSyncProcessor extends WorkerHost {
  constructor(private readonly zaloService: ZaloService) {
    super();
  }

  async process(job: Job) {
    const { appId, userId } = job.data;
    console.log(job.name);
    try {
      switch (job.name) {
        case 'first-time-sync':
          await this.zaloService.fetchMessagesWithinCustomTime(
            appId,
            3,
            'month',
          );
          this.zaloService.getAllUsers(appId);
          break;
        case 'sync-daily-zalo-conversations':
          await this.zaloService.fetchMessagesWithinCustomTime(appId, 1, 'day');

        case 'sync-zalo-conversations-with-user':
          console.log(
            `Syncing conversations with user ID: ${userId} for channel ID: ${appId}`,
          );
          await this.zaloService.handleSyncConversationsWithUserId(
            userId,
            appId,
          );
          break;
        default:
          console.warn(`Unknown job name: ${job.name}`);
      }
    } catch (error) {
      throw error; // Rethrow to mark the job as failed
    }
  }
}
