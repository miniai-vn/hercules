// import { Processor, WorkerHost } from '@nestjs/bullmq';
// import { Injectable, Logger } from '@nestjs/common';
// import { Job } from 'bullmq';
// import { LazadaService } from '../lazada.service';

// @Injectable()
// @Processor(process.env.REDIS_LAZADA_SYNC_TOPIC)
// export class LazadaSyncProcessor extends WorkerHost {
//   private readonly logger = new Logger(LazadaSyncProcessor.name);

//   constructor(private readonly lazadaService: LazadaService) {
//     super();
//   }

//   async process(job: Job<any>): Promise<any> {
//     this.logger.log(
//       `Processing Lazada sync job: ${job.name} with ID: ${job.id}`,
//     );

//     try {
//       switch (job.name) {
//         case 'sync-orders':
//           return await this.syncOrders(job.data);
//         case 'sync-products':
//           return await this.syncProducts(job.data);
//         case 'sync-inventory':
//           return await this.syncInventory(job.data);
//         case 'first-time-sync':
//           return await this.firstTimeSync(job.data);
//         default:
//           this.logger.warn(`Unknown job name: ${job.name}`);
//           throw new Error(`Unknown job name: ${job.name}`);
//       }
//     } catch (error) {
//       this.logger.error(`Error processing job ${job.name}:`, error);
//       throw error;
//     }
//   }

//   private async syncOrders(data: {
//     channelId: string;
//     appKey?: string;
//     appSecret?: string;
//     accessToken?: string;
//     syncType?: string;
//   }) {
//     this.logger.log(`Syncing orders for channel: ${data.channelId}`);

//     try {
//       const { appKey, appSecret, accessToken } = data;

//       if (!appKey || !appSecret || !accessToken) {
//         throw new Error('Missing required Lazada credentials');
//       }

//       // Get orders from the last 7 days
//       const sevenDaysAgo = new Date();
//       sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

//       const params = {
//         created_after: sevenDaysAgo.toISOString(),
//         limit: 100,
//         offset: 0,
//       };

//       const ordersData = await this.lazadaService.getOrders(
//         appKey,
//         appSecret,
//         accessToken,
//         params,
//       );

//       this.logger.log(
//         `Successfully synced ${ordersData?.data?.orders?.length || 0} orders`,
//       );

//       return {
//         success: true,
//         ordersCount: ordersData?.data?.orders?.length || 0,
//         channelId: data.channelId,
//       };
//     } catch (error) {
//       this.logger.error(
//         `Failed to sync orders for channel ${data.channelId}:`,
//         error,
//       );
//       throw error;
//     }
//   }

//   private async syncProducts(data: {
//     channelId: string;
//     appKey?: string;
//     appSecret?: string;
//     accessToken?: string;
//     syncType?: string;
//   }) {
//     this.logger.log(`Syncing products for channel: ${data.channelId}`);

//     try {
//       const { appKey, appSecret, accessToken } = data;

//       if (!appKey || !appSecret || !accessToken) {
//         throw new Error('Missing required Lazada credentials');
//       }

//       const params = {
//         limit: 100,
//         offset: 0,
//       };

//       const productsData = await this.lazadaService.getProducts(
//         appKey,
//         appSecret,
//         accessToken,
//         params,
//       );

//       this.logger.log(
//         `Successfully synced ${productsData?.data?.products?.length || 0} products`,
//       );

//       return {
//         success: true,
//         productsCount: productsData?.data?.products?.length || 0,
//         channelId: data.channelId,
//       };
//     } catch (error) {
//       this.logger.error(
//         `Failed to sync products for channel ${data.channelId}:`,
//         error,
//       );
//       throw error;
//     }
//   }

//   private async syncInventory(data: {
//     channelId: string;
//     appKey?: string;
//     appSecret?: string;
//     accessToken?: string;
//     inventoryUpdates?: any[];
//   }) {
//     this.logger.log(`Syncing inventory for channel: ${data.channelId}`);

//     try {
//       const { appKey, appSecret, accessToken, inventoryUpdates } = data;

//       if (!appKey || !appSecret || !accessToken) {
//         throw new Error('Missing required Lazada credentials');
//       }

//       if (!inventoryUpdates || inventoryUpdates.length === 0) {
//         this.logger.log('No inventory updates to process');
//         return { success: true, updatesCount: 0 };
//       }

//       let successCount = 0;
//       let errorCount = 0;

//       for (const update of inventoryUpdates) {
//         try {
//           await this.lazadaService.updateInventory(
//             appKey,
//             appSecret,
//             accessToken,
//             update,
//           );
//           successCount++;
//         } catch (error) {
//           this.logger.error(
//             `Failed to update inventory for item ${update.item_id}:`,
//             error,
//           );
//           errorCount++;
//         }
//       }

//       this.logger.log(
//         `Inventory sync completed: ${successCount} success, ${errorCount} errors`,
//       );

//       return {
//         success: true,
//         successCount,
//         errorCount,
//         channelId: data.channelId,
//       };
//     } catch (error) {
//       this.logger.error(
//         `Failed to sync inventory for channel ${data.channelId}:`,
//         error,
//       );
//       throw error;
//     }
//   }

//   private async firstTimeSync(data: {
//     channelId: string;
//     appKey?: string;
//     appSecret?: string;
//     accessToken?: string;
//   }) {
//     this.logger.log(
//       `Performing first-time sync for channel: ${data.channelId}`,
//     );

//     try {
//       // Perform both orders and products sync
//       const ordersResult = await this.syncOrders(data);
//       const productsResult = await this.syncProducts(data);

//       this.logger.log(
//         `First-time sync completed for channel: ${data.channelId}`,
//       );

//       return {
//         success: true,
//         orders: ordersResult,
//         products: productsResult,
//         channelId: data.channelId,
//       };
//     } catch (error) {
//       this.logger.error(
//         `Failed to perform first-time sync for channel ${data.channelId}:`,
//         error,
//       );
//       throw error;
//     }
//   }
// }
