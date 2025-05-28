import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   * Create a new category
   * @param category The category data to create
   * @returns The created category
   */
  async create(category: Partial<Category>): Promise<Category> {
    const categoryEntity = this.categoryRepository.create(category);
    return this.categoryRepository.save(categoryEntity);
  }

  /**
   * Find all categories
   * @returns Array of all categories
   */
  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      relations: ['shop', 'items'],
      where: { deletedAt: null },
    });
  }

  /**
   * Find category by id
   * @param id The category ID to find
   * @returns The found category
   */
  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['shop', 'items'],
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  /**
   * Update category by id
   * @param id The category ID to update
   * @param category The updated category data
   * @returns The updated category
   */
  async update(id: string, category: Partial<Category>): Promise<Category> {
    await this.categoryRepository.update(id, category);
    return this.findOne(id);
  }

  /**
   * Remove category by id
   * @param id The category ID to remove
   */
  async remove(id: string): Promise<void> {
    await this.categoryRepository.softDelete(id);
  }

  /**
   * Upsert a category (update or insert)
   * @param data The category data to upsert
   * @returns The upserted category
   */
  async upsert(data: Partial<Category>): Promise<Category> {
    // If the category exists (by id), update it; otherwise, create a new one
    let category = await this.categoryRepository.findOne({
      where: { id: data.id },
    });

    if (category) {
      await this.categoryRepository.update(data.id, data);
      category = await this.findOne(data.id as string);
    } else {
      category = this.categoryRepository.create(data);
      category = await this.categoryRepository.save(category);
    }
    return category;
  }
}
