import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Shop } from './shops.entity';
import { RolesService } from 'src/roles/roles.service';

@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
    private readonly roleService: RolesService, // Assuming roleService is similar to shopRepository
  ) {}

  async create({ name }: { name: string }): Promise<Shop> {
    const medataShop = this.shopRepository.create({
      name,
    });
    const shop = await this.shopRepository.save(medataShop);
    await this.roleService.initRoleDefault(shop);

    return this.shopRepository.findOne({
      where: { id: shop.id },
      relations: {
        roles: true,
      },
    });
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
}
