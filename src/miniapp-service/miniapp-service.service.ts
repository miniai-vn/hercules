import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';

@Injectable()
export class MiniappServiceService {
  @Cron('45 * * * * *')
  handleCron() {
    this.syncCategoriesFromMiniai();
  }

  private async getUrl({ method, requestUrl, payload = {} }) {
    const { MINIAI_SYNC_URL } = process.env;
    const url = `${MINIAI_SYNC_URL}/${requestUrl}`;

    try {
      let response;
      if (method === 'GET') {
        response = await axios.get(url, { ...payload });
      } else if (method === 'POST') {
        response = await axios.post(url, payload, { ...payload });
      } else if (method === 'DELETE') {
        response = await axios.delete(url, { ...payload });
      } else {
        return { error: 'Method not supported!' };
      }
      return { data: response.data };
    } catch (error) {
      return { error };
    }
  }

  async syncCategoriesFromMiniai() {
    try {
      const url = await this.getUrl({
        method: 'GET',
        requestUrl: 'categories',
      });
    } catch (error) {
      console.error('Error syncing data:', error);
    }
  }

  async syncItemsFromMiniai() {
    const url = await this.getUrl({
      method: 'GET',
      requestUrl: 'items',
    });
  }

  async fetchItems(url: string): Promise<any[]> {
    try {
      const response = await axios.get(`${url}/items`);
      return response.data.items;
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  }

  async fetchCategories(url: string): Promise<any[]> {
    try {
      const response = await axios.get(`${url}/categories`);
      return response.data.categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }
}
