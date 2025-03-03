import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
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
      const existingItem = await this.itemRepository.findOneBy({ sId });
      if (existingItem) {
        await this.itemRepository.update(existingItem.id, data);
        return this.findOne(existingItem.id);
      } else {
        const newItem = this.itemRepository.create({
          ...data,
          sId,
        });
        return await this.itemRepository.save(newItem);
      }
    } catch (error) {
      return { error };
    }
  }
}
