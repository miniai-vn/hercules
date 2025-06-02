import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { Queue } from 'bullmq';
import { CategoriesService } from 'src/categories/categories.service';
import { ItemsService } from 'src/items/items.service';
import { Shop } from 'src/shops/entities/shop';
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
    await this.syncDataShop(shop);
  }

  /**
   * Scheduled task to trigger data synchronization
   */
  // @Cron(CronExpression.EVERY_DAY_AT_NOON)
  // async syncDataShops() {
  //   const shops = await this.shopsService.findAllHavingZaloId();
  //   for (const shop of shops) {
  //     await this.syncDataShop(shop.id, shop.zaloId);
  //   }
  // }

  async syncDataShop(shop: Shop) {
    await this.syncCategories(shop);
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

  async syncCategories(shop: Shop) {
    const categoriesReponse = await this.makeApiRequest({
      method: 'GET',
      requestUrl: `/get-categories-by-zalo-id/${shop.zaloId}`,
      payload: {},
    });

    const categories = categoriesReponse.data;
    for (const category of categories) {
      const cate = await this.categoriesService.upsert({
        ...category,
        shop: shop,
      });
      const items = await this.makeApiRequest({
        method: 'GET',
        requestUrl: `/get-items-by-category-id/${cate.id}`,
      });
      for (let i = 0; i < items.data.length; i += 200) {
        const itemsBatch = items.data.slice(i, i + 200);
        Promise.all(
          itemsBatch.map((item) =>
            this.itemsService.upsert({
              ...item,
              shop: shop,
              category: cate,
            }),
          ),
        );
      }
    }
  }
}
