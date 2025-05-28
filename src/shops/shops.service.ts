import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Shop } from './entities/shop';

@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
  ) {}

  async create(data: Partial<Shop>): Promise<Shop> {
    const shop = this.shopRepository.create(data);
    return this.shopRepository.save(shop);
  }

  async findAll(): Promise<Shop[]> {
    return this.shopRepository.find();
  }

  async findOne(id: string): Promise<Shop | null> {
    return this.shopRepository.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<Shop>): Promise<Shop | null> {
    await this.shopRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.shopRepository.delete(id);
  }

  async findByZaloId(zaloId: string): Promise<Shop | null> {
    return this.shopRepository.findOne({ where: { zaloId } });
  }

  async findAllHavingZaloId(): Promise<Shop[]> {
    return this.shopRepository.find({ where: { zaloId: Not(IsNull()) } });
  }
}
