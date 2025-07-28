import { FacebookService } from './../facebook.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor(process.env.REDIS_FACEBOOK_SYNC_TOPIC, {
  concurrency: 20,
})
export class FacebookSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(FacebookSyncProcessor.name);

  constructor(private readonly facebookService: FacebookService) {
    super();
  }

  async process(job: Job) {
    const { conversationId, pageId } = job.data;

    try {
      switch (job.name) {
        case 'first-time-sync':
          await this.facebookService.syncConversationWithinCustomTimeFacebook(
            pageId,
            3,
            'month',
          );
          break;

        case 'sync-daily-facebook-conversations':
          await this.facebookService.syncConversationWithinCustomTimeFacebook(
            pageId,
            1,
            'day',
          );
          break;

        case 'sync-facebook-conversations':
          await this.facebookService.syncFacebookMesssageConversation(
            pageId,
            conversationId,
          );
          break;

        default:
          this.logger.warn(`Unknown job name: ${job.name}`);
      }
    } catch (error) {
      throw new Error(`${error || error.message}`);
    }
  }
}
