import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(category: Category): Promise<Category> {
    return await this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return await this.categoryRepository.find();
  }

  async findOne(id: number): Promise<Category> {
    return await this.categoryRepository.findOneBy({ id });
  }

  async update(id: number, category: Category): Promise<Category> {
    await this.categoryRepository.update(id, category);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.categoryRepository.delete(id);
  }

  async upsert(sId: string, data: Category): Promise<Category> {
    const existingCategory = await this.categoryRepository.findOneBy({ sId });
    if (existingCategory) {
      await this.categoryRepository.update(existingCategory.id, data);
      return this.findOne(existingCategory.id);
    } else {
      const newCategory = this.categoryRepository.create({
        ...data,
        sId,
      });
      return await this.categoryRepository.save(newCategory);
    }
  }
}
