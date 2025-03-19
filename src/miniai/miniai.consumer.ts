import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { CategoriesService } from 'src/categories/categories.service';
import { ItemsService } from 'src/items/items.service';
import { MiniaiService } from './miniai.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
@Processor('data-sync-queue')
export class MiniaiConsumer extends WorkerHost {
  private readonly logger = new Logger(MiniaiConsumer.name);

  // Tracking job execution timeouts
  private jobTimeouts: Map<string, { startTime: number; maxDuration: number }> =
    new Map();

  constructor(
    @InjectQueue('data-sync-queue') private readonly dataSyncQueue: Queue,
    private readonly miniaiService: MiniaiService,
    private readonly categoriesService: CategoriesService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job: ${job.id} of type: ${job.name}`);

    // Track job start time with appropriate timeout based on job type
    this.trackJobStart(job);

    try {
      switch (job.name) {
        case 'syncCategories': {
          this.logger.log(
            `Processing category sync for shop ${job.data.shop.name}`,
          );

          try {
            const result = await this.miniaiService.syncCategoriesForShop(
              job.data,
            );
            this.logger.log(
              `Category sync completed for shop ${job.data.shop.name}`,
            );
            return result;
          } catch (error) {
            this.logger.error(
              `Error in syncCategories for ${job.data.shop.name}: ${error.message}`,
              error.stack,
            );

            // If this is not the final retry attempt, schedule a retry
            if (job.attemptsMade < job.opts.attempts - 1) {
              this.logger.log(
                `Will retry syncCategories for ${job.data.shop.name} (attempt ${job.attemptsMade + 1}/${job.opts.attempts})`,
              );
              throw error; // Throwing will trigger BullMQ's retry mechanism
            }

            // If this was the final retry attempt, log and notify but don't throw
            this.logger.error(
              `Final retry failed for syncCategories job for shop ${job.data.shop.name}`,
            );
            return { success: false, error: error.message };
          }
        }

        case 'syncItems': {
          this.logger.log(
            `Processing item sync for shop ${job.data.shop.name}`,
          );

          try {
            const result = await this.miniaiService.syncItemsForShop(job.data);
            this.logger.log(
              `Item sync completed for shop ${job.data.shop.name}`,
            );
            return result;
          } catch (error) {
            this.logger.error(
              `Error in syncItems for ${job.data.shop.name}: ${error.message}`,
              error.stack,
            );

            // If this is not the final retry attempt, schedule a retry
            if (job.attemptsMade < job.opts.attempts - 1) {
              this.logger.log(
                `Will retry syncItems for ${job.data.shop.name} (attempt ${job.attemptsMade + 1}/${job.opts.attempts})`,
              );
              throw error; // Throwing will trigger BullMQ's retry mechanism
            }

            // Log final failure but return a response instead of throwing
            this.logger.error(
              `Final retry failed for syncItems job for shop ${job.data.shop.name}`,
            );
            return { success: false, error: error.message };
          }
        }

        case 'categoryBatch': {
          this.logger.log(
            `Processing category data batch with ${job.data.length} categories`,
          );
          const categories = job.data;
          let processedCount = 0;
          const errors = [];

          // Process categories with individual error handling
          for (const category of categories) {
            try {
              await this.categoriesService.upsertCategoryBySourceId(
                category.sId,
                {
                  ...category,
                },
              );
              processedCount++;

              // Update job progress
              await job.updateProgress(
                Math.floor((processedCount / categories.length) * 100),
              );
            } catch (error) {
              this.logger.error(
                `Error processing category ${category.sId}: ${error.message}`,
                error.stack,
              );
              errors.push({
                categoryId: category.sId,
                error: error.message,
              });
            }
          }

          // Log final status
          if (errors.length > 0) {
            this.logger.warn(
              `Processed ${processedCount} categories with ${errors.length} errors`,
            );

            // If more than 30% of items failed, consider the job failed
            if (
              errors.length > categories.length * 0.3 &&
              job.attemptsMade < job.opts.attempts - 1
            ) {
              this.logger.log(
                `Too many errors (${errors.length}/${categories.length}), will retry entire batch`,
              );
              throw new Error(
                `Failed to process ${errors.length} out of ${categories.length} categories`,
              );
            }
          } else {
            this.logger.log(
              `Processed ${processedCount} categories successfully`,
            );
          }

          return {
            success: errors.length === 0,
            count: processedCount,
            totalCount: categories.length,
            errors: errors.length > 0 ? errors : undefined,
          };
        }

        case 'itemBatch': {
          this.logger.log(`Processing batch of ${job.data.items.length} items`);

          try {
            const result = await this.miniaiService.processItemBatch(job.data);
            return result;
          } catch (error) {
            // Only retry if it's not the final attempt
            if (job.attemptsMade < job.opts.attempts - 1) {
              this.logger.log(
                `Will retry itemBatch (attempt ${job.attemptsMade + 1}/${job.opts.attempts})`,
              );
              throw error;
            }

            this.logger.error(
              `Final retry failed for itemBatch job: ${error.message}`,
              error.stack,
            );
            return { success: false, error: error.message };
          }
        }

        case 'clearAllJobs': {
          try {
            const result = await this.clearAllJobs(job.data?.jobTypes);
            return { ...result, message: 'Jobs cleared successfully' };
          } catch (error) {
            this.logger.error(
              `Error in clearAllJobs: ${error.message}`,
              error.stack,
            );
            return { success: false, error: error.message };
          }
        }

        case 'retryFailedJobs': {
          try {
            const result = await this.retryFailedJobs(job.data?.jobTypes);
            return result;
          } catch (error) {
            this.logger.error(
              `Error in retryFailedJobs: ${error.message}`,
              error.stack,
            );
            return { success: false, error: error.message };
          }
        }

        case 'cleanStuckJobs': {
          try {
            await this.cleanStuckJobs();
            return { success: true, message: 'Stuck jobs cleanup completed' };
          } catch (error) {
            this.logger.error(
              `Error in cleanStuckJobs: ${error.message}`,
              error.stack,
            );
            return { success: false, error: error.message };
          }
        }

        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(
        `Error processing job ${job.id} of type ${job.name}: ${error.message}`,
        error.stack,
      );
      throw error; // Re-throw to let BullMQ handle the retry
    } finally {
      // Remove job from tracking when completed
      this.jobTimeouts.delete(job.id);
    }
  }

  /**
   * Tracks the start of a job with an appropriate timeout based on job type
   * @param job The job to track
   */
  private trackJobStart(job: Job): void {
    // Define maximum durations in milliseconds based on job type
    const maxDurations = {
      syncCategories: 30 * 60 * 1000, // 30 minutes
      syncItems: 60 * 60 * 1000, // 60 minutes
      categoryBatch: 15 * 60 * 1000, // 15 minutes
      itemBatch: 20 * 60 * 1000, // 20 minutes
      clearAllJobs: 10 * 60 * 1000, // 10 minutes
      retryFailedJobs: 10 * 60 * 1000, // 10 minutes
      cleanStuckJobs: 10 * 60 * 1000, // 10 minutes
    };

    // Default to 30 minutes if not specified
    const maxDuration = maxDurations[job.name] || 30 * 60 * 1000;

    this.jobTimeouts.set(job.id, {
      startTime: Date.now(),
      maxDuration,
    });
  }

  /**
   * Scheduled task to check for and clean up stuck jobs
   * Runs every 15 minutes
   */
  @Cron('0 */15 * * * *')
  async cleanStuckJobs(): Promise<void> {
    this.logger.log('Checking for stuck jobs...');
    const now = Date.now();
    const stuckJobIds: string[] = [];

    // Check for stuck jobs based on our tracking
    this.jobTimeouts.forEach((timeoutInfo, jobId) => {
      const { startTime, maxDuration } = timeoutInfo;
      if (now - startTime > maxDuration) {
        stuckJobIds.push(jobId);
      }
    });

    if (stuckJobIds.length === 0) {
      this.logger.log('No stuck jobs found');
      return;
    }

    this.logger.log(
      `Found ${stuckJobIds.length} stuck jobs, attempting to clean up`,
    );

    // Get all active jobs from the queue
    const activeJobs = await this.dataSyncQueue.getJobs(['active']);

    // Process each stuck job
    for (const jobId of stuckJobIds) {
      try {
        // Find the job in active jobs
        const stuckJob = activeJobs.find((job) => job.id === jobId);

        if (stuckJob) {
          this.logger.log(
            `Cleaning up stuck job: ${jobId} (${stuckJob.name}), running for ${
              (now - this.jobTimeouts.get(jobId).startTime) / 1000 / 60
            } minutes`,
          );

          // Move the job to the failed state with a message
          await stuckJob.moveToFailed(
            new Error(
              `Job timed out after ${this.jobTimeouts.get(jobId).maxDuration / 1000 / 60} minutes`,
            ),
            true,
            true,
          );

          // Remove from tracking
          this.jobTimeouts.delete(jobId);
          this.logger.log(`Job ${jobId} marked as failed due to timeout`);
        } else {
          // Job not found in active queue but is in our tracking - clean up tracking
          this.logger.log(
            `Job ${jobId} not found in active queue but was in tracking, removing from tracking`,
          );
          this.jobTimeouts.delete(jobId);
        }
      } catch (error) {
        this.logger.error(
          `Error cleaning up stuck job ${jobId}: ${error.message}`,
          error.stack,
        );
      }
    }
  }

  /**
   * Adds a job to clean stuck jobs immediately
   * @returns Promise resolving to the added job
   */
  async addCleanStuckJobsTask(): Promise<Job> {
    this.logger.log('Adding clean stuck jobs task to queue');
    return this.dataSyncQueue.add(
      'cleanStuckJobs',
      {
        timestamp: new Date().toISOString(),
      },
      {
        priority: 1, // Highest priority
        attempts: 1,
      },
    );
  }

  /**
   * Clears all jobs from the queue
   * @param jobTypes Optional array of job types to clear. If not provided, clears all jobs.
   * @returns Object with success status and count of removed jobs
   */
  async clearAllJobs(
    jobTypes?: string[],
  ): Promise<{ success: boolean; count: number }> {
    try {
      this.logger.log('Starting to clear jobs from the queue');

      // Get all job IDs from different states
      const waitingJobs = await this.dataSyncQueue.getJobs(['waiting']);
      const activeJobs = await this.dataSyncQueue.getJobs(['active']);
      const delayedJobs = await this.dataSyncQueue.getJobs(['delayed']);
      const completedJobs = await this.dataSyncQueue.getJobs(['completed']);
      const failedJobs = await this.dataSyncQueue.getJobs(['failed']);

      const allJobs = [
        ...waitingJobs,
        ...activeJobs,
        ...delayedJobs,
        ...completedJobs,
        ...failedJobs,
      ];

      this.logger.log(`Found ${allJobs.length} jobs in total`);

      let removedCount = 0;

      // Remove jobs based on job types or all jobs
      for (const job of allJobs) {
        if (!jobTypes || jobTypes.includes(job.name)) {
          await job.remove();
          removedCount++;

          // Log progress every 10 jobs
          if (removedCount % 10 === 0) {
            this.logger.log(`Removed ${removedCount} jobs so far`);
          }
        }
      }

      this.logger.log(
        `Successfully removed ${removedCount} jobs from the queue`,
      );
      return { success: true, count: removedCount };
    } catch (error) {
      this.logger.error(
        `Error clearing jobs from the queue: ${error.message}`,
        error.stack,
      );
      return { success: false, count: 0 };
    }
  }

  /**
   * Retries all failed jobs in the queue
   * @param jobTypes Optional array of job types to retry. If not provided, retries all failed jobs.
   * @returns Object with success status and count of retried jobs
   */
  async retryFailedJobs(
    jobTypes?: string[],
  ): Promise<{ success: boolean; count: number }> {
    try {
      this.logger.log('Starting to retry failed jobs');

      // Get all failed jobs
      const failedJobs = await this.dataSyncQueue.getJobs(['failed']);
      this.logger.log(`Found ${failedJobs.length} failed jobs`);

      let retriedCount = 0;

      // Retry each failed job
      for (const job of failedJobs) {
        if (!jobTypes || jobTypes.includes(job.name)) {
          await job.retry();
          retriedCount++;

          // Log progress every 10 jobs
          if (retriedCount % 10 === 0) {
            this.logger.log(`Retried ${retriedCount} jobs so far`);
          }
        }
      }

      this.logger.log(`Successfully retried ${retriedCount} failed jobs`);
      return { success: true, count: retriedCount };
    } catch (error) {
      this.logger.error(
        `Error retrying failed jobs: ${error.message}`,
        error.stack,
      );
      return { success: false, count: 0 };
    }
  }

  /**
   * Adds a job to clear all jobs from the queue
   * @param jobTypes Optional array of job types to clear
   * @returns Promise resolving to the added job
   */
  async addClearAllJobsTask(jobTypes?: string[]): Promise<Job> {
    this.logger.log('Adding clear all jobs task to queue');
    return this.dataSyncQueue.add(
      'clearAllJobs',
      {
        timestamp: new Date().toISOString(),
        jobTypes,
      },
      {
        priority: 1, // High priority to process this first
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
  }

  /**
   * Adds a job to retry all failed jobs
   * @param jobTypes Optional array of job types to retry
   * @returns Promise resolving to the added job
   */
  async addRetryFailedJobsTask(jobTypes?: string[]): Promise<Job> {
    this.logger.log('Adding retry failed jobs task to queue');
    return this.dataSyncQueue.add(
      'retryFailedJobs',
      {
        timestamp: new Date().toISOString(),
        jobTypes,
      },
      {
        priority: 1, // High priority
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
  }
}
