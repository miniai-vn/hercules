import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { LazadaService } from '../lazada.service';

@Injectable()
@Processor(process.env.REDIS_LAZADA_SYNC_TOPIC)
export class LazadaSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(LazadaSyncProcessor.name);

  constructor(private readonly lazadaService: LazadaService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    this.logger.log(
      `Processing Lazada sync job: ${job.name} with ID: ${job.id}`,
    );

    try {
      switch (job.name) {
        case 'first-time-sync':
          await this.lazadaService.fetchMessagesWithinCustomTime(
            job.data.appId,
            1,
            'month',
          );

        default:
          this.logger.warn(`Unknown job name: ${job.name}`);
          throw new Error(`Unknown job name: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(`Error processing job ${job.name}:`, error);
      throw error;
    }
  }
}
