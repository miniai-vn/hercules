import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shops } from './entities/shop';

@Injectable()
export class ShopsService {
  constructor(
    @InjectRepository(Shops)
    private readonly shopRepository: Repository<Shops>,
  ) {}

  async create(shop: Shops): Promise<Shops> {
    return await this.shopRepository.save(shop);
  }

  async findAll(): Promise<Shops[]> {
    return await this.shopRepository.find();
  }

  async findOne(id: number): Promise<Shops> {
    return await this.shopRepository.findOneBy({ id });
  }

  async update(id: number, shop: Shops): Promise<Shops> {
    await this.shopRepository.update(id, shop);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.shopRepository.delete(id);
  }
}
