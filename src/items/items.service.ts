import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item';
import { Skus } from './entities/sku';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(Skus)
    private readonly skuRepository: Repository<Skus>,
  ) {}

  async create(item: Item): Promise<Item> {
    return await this.itemRepository.save(item);
  }

  async findAll(): Promise<Item[]> {
    return await this.itemRepository.find();
  }

  async findOne(id: number): Promise<Item> {
    return await this.itemRepository.findOneBy({ id });
  }

  async update(id: number, item: Item): Promise<Item> {
    await this.itemRepository.update(id, item);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.itemRepository.delete(id);
  }

  async upsert(sId: string, data: Item) {
    try {
      let item = await this.itemRepository.findOne({ where: { sId } });
      if (item) {
        await this.itemRepository.update(item.id, {
          category: data.category,
          description: data.description,
          images: data.images,
          name: data.name,
          originPrice: data.originPrice,
          price: data.price,
          sId,
          shop: data.shop,
          status: data.status,
          type: data.type,
        });
        item = await this.itemRepository.findOneBy({ id: item.id });
      } else {
        const newItem = this.itemRepository.create({
          category: data.category,
          description: data.description,
          images: data.images,
          name: data.name,
          originPrice: data.originPrice,
          price: data.price,
          sId,
          shop: data.shop,
          status: data.status,
          type: data.type,
        });
        item = await this.itemRepository.save(newItem);
      }
      await this.upsertManySkus(
        data.skus.map((sku) => ({
          ...sku,
          shop: data.shop,
          item: item,
        })),
      );

      return item;
    } catch (error) {
      console.log('Error upserting item:', error);
      return { error };
    }
  }

  async upsertSku(sku: Skus) {
    try {
      const existingSku = await this.skuRepository.findOneBy({ sId: sku.sId });
      if (existingSku) {
        await this.skuRepository.update(existingSku.id, sku);
        return sku;
      } else {
        const newSku = this.skuRepository.create(sku);
        return await this.skuRepository.save(newSku);
      }
    } catch (error) {
      console.log('Error upserting sku:', error);
      return { error };
    }
  }

  async upsertManySkus(skus: Skus[]) {
    return await Promise.all(skus.map((sku) => this.upsertSku(sku)));
  }
}
