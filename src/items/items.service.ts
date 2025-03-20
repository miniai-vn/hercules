import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item';
import { Skus } from './entities/sku';

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
  async findItemById(id: number): Promise<Item> {
    try {
      const item = await this.itemRepository.findOneBy({ id });
      if (!item) {
        throw new Error(`Item with ID ${id} not found`);
      }
      return item;
    } catch (error) {
      this.logger.error(
        `Failed to find item ${id}: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to find item: ${error.message}`);
    }
  }

  /**
   * Update item by id
   */
  async updateItem(id: number, item: Item): Promise<Item> {
    try {
      const result = await this.itemRepository.update(id, item);
      if (result.affected === 0) {
        throw new Error(`Item with ID ${id} not found`);
      }
      return this.findItemById(id);
    } catch (error) {
      this.logger.error(
        `Failed to update item ${id}: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to update item: ${error.message}`);
    }
  }

  /**
   * Remove item by id
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
  async upsertItemBySourceId(sId: string, data: Item) {
    try {
      this.logger.log(`Upserting item with source ID: ${sId}`);
      let item = await this.itemRepository.findOne({ where: { sId } });

      if (item) {
        this.logger.debug(`Updating existing item: ${item.id}`);
        await this.itemRepository.update(item.id, {
          category: data.category || null,
          description: data.description,
          images: data.images,
          name: data.name,
          originPrice: data.originPrice,
          price: data.price,
          sId,
          shop: data.shop,
          status: data.status,
          type: data.type,
          updatedAt: new Date(),
        });
        item = await this.itemRepository.findOneBy({ id: item.id });
      } else {
        this.logger.debug(`Creating new item for source ID: ${sId}`);
        const newItem = this.itemRepository.create({
          category: data.category ?? null,
          description: data.description,
          images: data.images,
          name: data.name,
          originPrice: data.originPrice,
          price: data.price,
          sId,
          shop: data.shop,
          status: data.status,
          type: data.type,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        item = await this.itemRepository.save(newItem);
      }

      // Only process SKUs if they exist
      if (data.skus && Array.isArray(data.skus) && data.skus.length > 0) {
        await this.upsertMultipleSkus(
          data.skus.map((sku) => ({
            ...sku,
            shop: data.shop,
            item: item,
          })),
        );
      }

      return item;
    } catch (error) {
      this.logger.error(
        `Error upserting item ${sId}: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to upsert item: ${error.message}`);
    }
  }

  /**
   * Upsert a single SKU
   */
  async upsertSku(sku: Skus) {
    try {
      this.logger.debug(`Upserting SKU with source ID: ${sku.sId}`);
      const existingSku = await this.skuRepository.findOneBy({ sId: sku.sId });

      if (existingSku) {
        this.logger.debug(`Updating existing SKU: ${existingSku.id}`);
        await this.skuRepository.update(existingSku.id, {
          ...sku,
          updatedAt: new Date(),
        });
        return await this.skuRepository.findOneBy({ id: existingSku.id });
      } else {
        this.logger.debug(`Creating new SKU for source ID: ${sku.sId}`);
        const newSku = this.skuRepository.create({
          ...sku,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return await this.skuRepository.save(newSku);
      }
    } catch (error) {
      this.logger.error(
        `Error upserting SKU ${sku.sId}: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to upsert SKU: ${error.message}`);
    }
  }

  /**
   * Upsert multiple SKUs in parallel
   */
  async upsertMultipleSkus(skus: Skus[]) {
    this.logger.log(`Upserting ${skus.length} SKUs`);
    const results = await Promise.allSettled(
      skus.map((sku) => this.upsertSku(sku)),
    );

    // Check for failures
    const failures = results
      .filter(
        (result): result is PromiseRejectedResult =>
          result.status === 'rejected',
      )
      .map((result) => result.reason);

    if (failures.length > 0) {
      this.logger.warn(
        `${failures.length} of ${skus.length} SKU upserts failed`,
      );
    }

    return results;
  }

  // Legacy method names for backward compatibility
  async findAll(): Promise<Item[]> {
    return this.findAllItems();
  }

  async findOne(id: number): Promise<Item> {
    return this.findItemById(id);
  }

  async create(item: Item): Promise<Item> {
    return this.createItem(item);
  }

  async update(id: number, item: Item): Promise<Item> {
    return this.updateItem(id, item);
  }

  async remove(id: number): Promise<void> {
    return this.removeItem(id);
  }

  async upsert(sId: string, data: Item) {
    return this.upsertItemBySourceId(sId, data);
  }

  async upsertManySkus(skus: Skus[]) {
    return this.upsertMultipleSkus(skus);
  }
}
