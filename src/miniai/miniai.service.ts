import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { CategoriesService } from 'src/categories/categories.service';
import { ItemsService } from 'src/items/items.service';
import { ShopsService } from 'src/shops/shops.service';
import * as dayjs from 'dayjs';

@Injectable()
export class MiniaiService {
  isJobRunning;
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly itemsService: ItemsService,
    private readonly shopsService: ShopsService,
  ) {
    this.isJobRunning = false;
  }

  @Cron('* * * * * *')
  async handleCron() {
    if (this.isJobRunning) {
      return;
    }
    try {
      console.log('Start syncing data from Miniai');
      this.isJobRunning = true;
      const allShop = await this.shopsService.findAll();
      for (const shop of allShop) {
        await this.syncCategoriesFromMiniai({ shop, sShopId: shop.sId });
        await this.syncItemsFromMiniai({ shop, sShopId: shop.sId });
      }
    } catch (error) {
      console.error('Error syncing data:', error);
    } finally {
      this.isJobRunning = false;
    }
  }

  private async fetchData({ method, requestUrl = '', payload = {} }) {
    const { MINIAI_SYNC_URL, MINIAI_TOKEN } = process.env;
    const url = `${MINIAI_SYNC_URL}${requestUrl}`;
    const header = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MINIAI_TOKEN}`,
    };
    try {
      let response;
      if (method === 'GET') {
        response = await axios.get(url, { headers: header, ...payload });
      } else if (method === 'POST') {
        response = await axios.post(url, payload, {
          headers: header,
          ...payload,
        });
      } else if (method === 'DELETE') {
        response = await axios.delete(url, { headers: header, ...payload });
      } else {
        return { error: 'Method not supported!' };
      }
      return { data: response.data.data };
    } catch (error) {
      return { error };
    }
  }

  async syncCategoriesFromMiniai({ shop, sShopId }) {
    try {
      const categories = await this.fetchData({
        method: 'POST',
        requestUrl: '',
        payload: {
          method: 'getCategories',
          shopId: sShopId,
          startTime: dayjs().startOf('day').toISOString(),
          endTime: dayjs().endOf('day').toISOString(),
        },
      });

      for (const cate of categories.data) {
        const sId = cate.id;
        cate.shop = shop;
        cate.categoryid = cate.categoryId;
        delete cate.shopId;
        delete cate.categoryId;
        delete cate.id;
        await this.categoriesService.upsert(sId, cate);
      }
    } catch (error) {
      console.error('Error syncing data:', error);
    }
  }

  async syncItemsFromMiniai({ shop, sShopId }) {
    const allCategories = await this.categoriesService.findAll();
    for (const category of allCategories) {
      const items = await this.fetchData({
        method: 'POST',
        requestUrl: '',
        payload: {
          method: 'getItemByCategory',
          shopId: sShopId,
          categoryId: category.sId,
          startTime: dayjs().startOf('day').toISOString(),
          endTime: dayjs().endOf('day').toISOString(),
        },
      });

      for (const item of items.data) {
        const sId = item.id;
        item.shop = shop;
        item.category = category;
        delete item.id;
        delete item.shopId;
        await this.itemsService.upsert(sId, item);
        await new Promise((res) => setTimeout(res, 300));
      }
    }
  }
}
