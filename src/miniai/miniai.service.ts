import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { Queue } from 'bullmq';
import { CategoriesService } from 'src/categories/categories.service';
import { ItemsService } from 'src/items/items.service';
import { ShopService } from 'src/shops/shops.service';
enum MiniaiMessageType {
  SYNC_CATEGORIES = 'syncCategories',
  SYNC_ITEMS = 'syncItems',
  SYNC_SHOPS = 'syncShops',
  SYNC_ORDERS = 'syncOrders',
}

@Injectable()
export class MiniaiService {
  private readonly logger = new Logger(MiniaiService.name);
  private readonly pageSize = 50; // Configure page size for API requests
  private lastFetchTime: Record<string, Date> = {}; // Track last fetch times by endpoint/method

  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly itemsService: ItemsService,
    private readonly shopsService: ShopService,
  ) {}

  async startSync(shopId: string) {
    const shop = await this.shopsService.findOne(shopId);
    console.log('Starting sync for shop:', shop);
    await this.syncDataShop(shopId, shop.zaloId);
  }

  /**
   * Scheduled task to trigger data synchronization
   */
  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async syncDataShops() {
    const shops = await this.shopsService.findAllHavingZaloId();
    for (const shop of shops) {
      await this.syncDataShop(shop.id, shop.zaloId);
    }
  }

  async syncDataShop(shopId: string, zaloId: string) {
    await this.syncCategories(zaloId);
    await this.syncItems(shopId);
  }

  private async makeApiRequest({ method, requestUrl = '', payload = {} }) {
    const { MINIAI_SYNC_URL, MINIAI_TOKEN } = process.env;
    const url = `${MINIAI_SYNC_URL}${requestUrl}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MINIAI_TOKEN}`,
    };

    try {
      let response;
      this.logger.debug(`Making ${method} request to ${url}`);

      if (method === 'GET') {
        response = await axios.get(url, { headers, params: payload });
      } else if (method === 'POST') {
        response = await axios.post(url, payload, { headers });
      } else if (method === 'DELETE') {
        response = await axios.delete(url, {
          headers,
          params: payload,
        });
      } else {
        return { error: 'Method not supported!' };
      }

      return {
        data: response.data.data,
      };
    } catch (error) {
      return {
        error,
      };
    }
  }

  async syncCategories(zaloId: string) {
    const categoriesReponse = await this.makeApiRequest({
      method: 'GET',
      requestUrl: `/get-categories-by-zalo-id/${zaloId}`,
      payload: {},
    });

    const categories = categoriesReponse.data;
    console.log('Categories from Miniai:', categories);
    for (const category of categories) {
      await this.categoriesService.upsert(category);
    }

    // for (const category of data) {
    //   await this.categoriesService.upsertCategoryBySourceId(category.sId, {
    //     ...category,
    //   });
    // }
  }

  async syncItems(shopId: string) {
    // const allCategory = await this.categoriesService.find();
  }
}
