import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './items.entity';
import { Skus } from './sku.entity';

@Injectable()
export class ItemsService {
  private readonly logger = new Logger(ItemsService.name);

  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(Skus)
    private readonly skuRepository: Repository<Skus>,
  ) {}

  /**
   * Create a new item
   */
  async createItem(item: Item): Promise<Item> {
    try {
      return await this.itemRepository.save(item);
    } catch (error) {
      this.logger.error(`Failed to create item: ${error.message}`, error.stack);
      throw new Error(`Failed to create item: ${error.message}`);
    }
  }

  /**
   * Find all items
   */
  async findAllItems(): Promise<Item[]> {
    try {
      return await this.itemRepository.find();
    } catch (error) {
      this.logger.error(`Failed to fetch items: ${error.message}`, error.stack);
      throw new Error(`Failed to fetch items: ${error.message}`);
    }
  }

  /**
   * Find item by id
   */

  async removeItem(id: number): Promise<void> {
    try {
      const result = await this.itemRepository.delete(id);
      if (result.affected === 0) {
        throw new Error(`Item with ID ${id} not found`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to remove item ${id}: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to remove item: ${error.message}`);
    }
  }

  /**
   * Upsert item by source ID
   */
  async upsert(data: Partial<Item>): Promise<string> {
    let item = await this.itemRepository.findOne({ where: { id: data.id } });
    const skus = data.skus || [];
    delete data.skus; // Remove skus from data to avoid duplication
    if (item) {
      await this.itemRepository.update(item.id, {
        ...data,
        updatedAt: new Date(),
      });
    } else {
      item = this.itemRepository.create(data);
      item = await this.itemRepository.save(item);
    }

    if (skus && skus.length > 0) {
      await Promise.all(
        skus.map(async (sku) => {
          sku.item = item;
          sku.shop = data.shop;
          await this.upsertSku(sku);
        }),
      );
    }

    return item.id;
  }

  /**
   * Upsert a single SKU
   */
  async upsertSku(sku: Partial<Skus>): Promise<string> {
    let existingSku = await this.skuRepository.findOne({
      where: { id: sku.id },
    });

    if (existingSku) {
      await this.skuRepository.update(existingSku.id, {
        ...sku,
        updatedAt: new Date(),
      });
      return existingSku.id;
    } else {
      const newSku = this.skuRepository.create({
        ...sku,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const savedSku = await this.skuRepository.save(newSku);
      return savedSku.id;
    }
  }
}
