import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop } from './entities/shop';

@Injectable()
export class ShopsService {
  constructor(
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
  ) {}

  async create(shop: Shop): Promise<Shop> {
    return await this.shopRepository.save(shop);
  }

  async findAll(): Promise<Shop[]> {
    return await this.shopRepository.find();
  }

  async findOne(id: number): Promise<Shop> {
    return await this.shopRepository.findOneBy({ id });
  }

  async update(id: number, shop: Shop): Promise<Shop> {
    await this.shopRepository.update(id, shop);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.shopRepository.delete(id);
  }
}
