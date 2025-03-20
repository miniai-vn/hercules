import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { Queue } from 'bullmq';
import e from 'express';
import { CategoriesService } from 'src/categories/categories.service';
import { ItemsService } from 'src/items/items.service';
import { ShopsService } from 'src/shops/shops.service';

@Injectable()
export class MiniaiService {
  private readonly logger = new Logger(MiniaiService.name);
  private readonly pageSize = 50; // Configure page size for API requests
  private lastFetchTime: Record<string, Date> = {}; // Track last fetch times by endpoint/method

  constructor(
    @InjectQueue('data-sync-queue') private readonly dataSyncQueue: Queue,
    private readonly categoriesService: CategoriesService,
    private readonly itemsService: ItemsService,
    private readonly shopsService: ShopsService,
  ) {}
  /**
   * Scheduled task to trigger data synchronization
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async scheduleSyncJobs() {
    try {
      this.logger.log('Scheduling data sync jobs from Miniai');
      const shops = await this.shopsService.findAll();
      // Add sync jobs to the queue for each shop
      for (const shop of shops) {
        await this.queueCategorySync(shop);
        await this.queueItemSync(shop);
      }

      // this.logger.log(`Scheduled sync jobs for ${shops.length} shops`);
    } catch (error) {
      this.logger.error(
        `Error scheduling sync jobs: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Queue a category synchronization job for a shop
   * Prevents adding a new job if related jobs are already running
   */
  async queueCategorySync(shop) {
    try {
      this.logger.log(
        `Checking if category sync for shop: ${shop.name} (ID: ${shop.sId}) is needed`,
      );

      // No existing jobs, add to queue
      this.logger.log(
        `Queueing category sync for shop: ${shop.name} (ID: ${shop.sId})`,
      );
      const job = await this.dataSyncQueue.add(
        'syncCategories',
        {
          shop,
          sShopId: shop.sId,
        },
        {
          delay: 1000,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },

          jobId: `sync-categories-${shop.sId}-${Date.now()}`,
        },
      );

      return { success: true, jobId: job.id };
    } catch (error) {
      this.logger.error(
        `Error queueing category sync for shop ${shop.name}: ${error.message}`,
        error.stack,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Queue an item synchronization job for a shop
   * Prevents adding a new job if related jobs are already running
   */
  async queueItemSync(shop) {
    try {
      this.logger.log(
        `Queueing item sync for shop: ${shop.name} (ID: ${shop.sId})`,
      );

      const job = await this.dataSyncQueue.add(
        'syncItems',
        {
          shop,
          sShopId: shop.sId,
        },
        {
          delay: 30000,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          jobId: `sync-items-${shop.sId}-${Date.now()}`,
        },
      );

      return { success: true, jobId: job.id };
    } catch (error) {
      this.logger.error(
        `Error queueing item sync for shop ${shop.name}: ${error.message}`,
        error.stack,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Make API requests to external services with error handling
   * Adds time range parameters based on last fetch time
   */
  private async makeApiRequest({
    method,
    requestUrl = '',
    payload = {},
    forceRefresh = false,
  }) {
    const { MINIAI_SYNC_URL, MINIAI_TOKEN } = process.env;
    const url = `${MINIAI_SYNC_URL}${requestUrl}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MINIAI_TOKEN}`,
    };

    // Create a unique key for this request
    const requestKey = `${method}:${requestUrl}:${JSON.stringify(payload)}`;

    // Get current time
    const now = new Date();
    var enhancedPayload = { ...payload };

    // Determine start time based on last fetch time
    let startTime;
    if (this.lastFetchTime[requestKey] && !forceRefresh) {
      // Use last fetch time as start
      startTime = this.lastFetchTime[requestKey];
      this.logger.debug(
        `Using last fetch time as startTime: ${startTime.toISOString()}`,
      );

      // Only calculate time range and add to payload if we have a startTime
      const twoHoursLater = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
      const formattedStartTime = startTime.toISOString();
      const formattedEndTime = twoHoursLater.toISOString();

      this.logger.log(
        `Adding time range to request: ${formattedStartTime} to ${formattedEndTime}`,
      );

      // Add time parameters only when we have a valid startTime
      enhancedPayload = {
        ...payload,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
      };
    } else {
      // For initial sync or force refresh, don't add time parameters
      this.logger.debug(
        'No last fetch time available, skipping time range parameters',
      );
    }

    try {
      let response;
      this.logger.debug(`Making ${method} request to ${url}`);

      if (method === 'GET') {
        response = await axios.get(url, { headers, params: enhancedPayload });
      } else if (method === 'POST') {
        response = await axios.post(url, enhancedPayload, { headers });
      } else if (method === 'DELETE') {
        response = await axios.delete(url, {
          headers,
          params: enhancedPayload,
        });
      } else {
        return { error: 'Method not supported!' };
      }

      // Store last fetch time
      this.lastFetchTime[requestKey] = now;

      // Add time range and fetch information to the response
      return {
        data: response.data.data,
        fetchTime: now,
        lastFetchTime: this.lastFetchTime[requestKey] || null,
      };
    } catch (error) {
      this.logger.error(
        `API request error to ${url}: ${error.message}`,
        error.stack,
      );
      return {
        error,
        lastFetchTime: this.lastFetchTime[requestKey] || null,
      };
    }
  }

  /**
   * Get the last fetch time for a specific API request
   */
  getLastRequestTime({ method, requestUrl = '', payload = {} }) {
    const requestKey = `${method}:${requestUrl}:${JSON.stringify(payload)}`;
    return this.lastFetchTime[requestKey] || null;
  }

  /**
   * Synchronize categories for a specific shop
   */
  async syncCategoriesForShop({
    shop,
    sShopId,
    page = 1,
    limit = this.pageSize,
  }) {
    try {
      this.logger.log(
        `Syncing categories for shop ${shop.name} (ID: ${sShopId})`,
      );
      let currentPage = page;
      let hasMoreData = true;
      let totalCategories = 0;
      const pageSize = limit;

      while (hasMoreData) {
        this.logger.log(
          `Fetching categories page ${currentPage} (${pageSize} items per page)`,
        );

        const categoriesResponse = await this.makeApiRequest({
          method: 'POST',
          requestUrl: '',
          payload: {
            method: 'getCategories',
            shopId: sShopId,
            page: currentPage,
            limit: pageSize,
          },
        });

        if (categoriesResponse.error) {
          this.logger.error(
            'Error fetching categories:',
            categoriesResponse.error,
          );
          return { success: false, error: categoriesResponse.error };
        }

        const categories = categoriesResponse.data || [];

        if (categories.length === 0) {
          hasMoreData = false;
          this.logger.log(`No more categories to fetch for shop ${shop.name}`);
          continue;
        }

        // Transform categories data
        const newCategories = categories.map((category) => ({
          sId: category.id.toString(),
          name: category.name,
          description: category.description,
          shop: shop,
          type: category.type || 'default',
          status: category.status || 'active',
          createdAt: category.createdAt || new Date(),
          updatedAt: category.updatedAt || new Date(),
        }));

        // Add categories to processing queue
        await this.dataSyncQueue.add('categoryBatch', newCategories, {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        });

        totalCategories += categories.length;

        // Check if we've received fewer items than the page size
        if (categories.length < pageSize) {
          hasMoreData = false;
        } else {
          currentPage++;
        }
      }

      this.logger.log(
        `Successfully queued ${totalCategories} categories for processing from shop ${shop.name}`,
      );
      return { success: true, count: totalCategories };
    } catch (error) {
      this.logger.error(
        `Error in syncCategoriesForShop: ${error.message}`,
        error.stack,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Synchronize items for a specific shop
   */
  async syncItemsForShop({ shop, sShopId, page = 1, limit = this.pageSize }) {
    try {
      this.logger.log(`Syncing items for shop ${shop.name} (ID: ${sShopId})`);
      const allCategories = await this.categoriesService.findAll();

      let currentPage = page;
      let hasMoreData = true;
      let totalItems = 0;
      const pageSize = limit;

      while (hasMoreData) {
        this.logger.log(
          `Fetching items page ${currentPage} (${pageSize} items per page)`,
        );

        const itemsResponse = await this.makeApiRequest({
          method: 'POST',
          requestUrl: '',
          payload: {
            method: 'getItemWithCategory',
            shopId: sShopId,
            page: currentPage,
            limit: pageSize,
          },
        });

        if (itemsResponse.error) {
          this.logger.error('Error fetching items:', itemsResponse.error);
          return { success: false, error: itemsResponse.error };
        }

        const items = itemsResponse.data || [];

        if (items.length === 0) {
          hasMoreData = false;
          this.logger.log(`No more items to fetch for shop ${shop.name}`);
          continue;
        }
        // Process items in smaller batches to avoid memory issues
        const batchSize = 20;
        for (let i = 0; i < items.length; i += batchSize) {
          const itemBatch = items.slice(i, i + batchSize);

          // Create batch job
          await this.dataSyncQueue.add(
            'itemBatch',
            {
              items: itemBatch,
              shop,
              allCategories,
            },
            {
              delay: Math.floor(Math.random() * 700) + 100, // Random delay to avoid rate limiting
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 5000,
              },
            },
          );
        }

        totalItems += items.length;

        // Check if we've received fewer items than the page size
        if (items.length < pageSize) {
          hasMoreData = false;
        } else {
          currentPage++;
        }
      }

      this.logger.log(
        `Successfully queued ${totalItems} items for processing from shop ${shop.name}`,
      );
      return { success: true, count: totalItems };
    } catch (error) {
      this.logger.error(
        `Error in syncItemsForShop: ${error.message}`,
        error.stack,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Process a batch of items - will be called by the consumer
   */
  async processItemBatch({ items, shop, allCategories }) {
    this.logger.log(`Processing batch of ${items.length} items`);
    let processedCount = 0;
    const errors = [];

    for (const item of items) {
      try {
        const sId = item.id;
        const category = allCategories.find(
          (cate) => cate.id === item.categoryId,
        );

        const dataObject = {
          id: item.id,
          sId: item.id.toString(),
          name: item.name,
          price: item.price,
          originPrice: item.originPrice || 0,
          description: item.description,
          images: item.images || [],
          image: item.image,
          category: category,
          shop: shop,
          type: item.type || 'default',
          status: item.status || 'active',
          createdAt: item.createdAt || new Date(),
          updatedAt: item.updatedAt || new Date(),
          skus: item?.skus?.map((sku) => ({
            sId: sku.id,
            price: sku.price,
            shop: shop,
            item: item,
            name: sku.name,
            images: sku.images,
            originPrice: sku.originPrice || 0,
            status: sku.status || 'active',
            isActive: sku.isActive || true,
            createdAt: sku.createdAt || new Date(),
            updatedAt: sku.updatedAt || new Date(),
          })),
        };

        await this.itemsService.upsertItemBySourceId(sId, dataObject);
        processedCount++;
      } catch (error) {
        this.logger.error(
          `Error processing item ${item.id}: ${error.message}`,
          error.stack,
        );
        errors.push({
          itemId: item.id,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Successfully processed ${processedCount}/${items.length} items`,
    );
    return {
      success: true,
      processed: processedCount,
      total: items.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // Legacy method names for backward compatibility
  async fetchData(params) {
    return this.makeApiRequest(params);
  }

  async syncCategories(params) {
    return this.syncCategoriesForShop(params);
  }

  async syncItemsFromMiniai(params) {
    return this.syncItemsForShop(params);
  }
}
