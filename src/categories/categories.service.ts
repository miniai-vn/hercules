import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
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
  async createCategory(category: Category): Promise<Category> {
    try {
      this.logger.log(`Creating new category: ${category.name}`);

      if (!category.name) {
        throw new BadRequestException('Category name is required');
      }

      return await this.categoryRepository.save(category);
    } catch (error) {
      this.logger.error(
        `Failed to create category: ${error.message}`,
        error.stack,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to create category: ${error.message}`,
      );
    }
  }

  /**
   * Find all categories
   * @returns Array of all categories
   */
  async findAllCategories(): Promise<Category[]> {
    try {
      this.logger.log('Fetching all categories');
      return await this.categoryRepository.find();
    } catch (error) {
      this.logger.error(
        `Failed to fetch categories: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to fetch categories: ${error.message}`,
      );
    }
  }

  /**
   * Find category by id
   * @param id The category ID to find
   * @returns The found category
   */
  async findCategoryById(id: number): Promise<Category> {
    try {
      this.logger.log(`Fetching category with id: ${id}`);
      const category = await this.categoryRepository.findOneBy({ id });

      if (!category) {
        this.logger.warn(`Category with ID ${id} not found`);
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      return category;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Failed to find category ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to find category: ${error.message}`,
      );
    }
  }

  /**
   * Update category by id
   * @param id The category ID to update
   * @param category The updated category data
   * @returns The updated category
   */
  async updateCategory(id: number, category: Category): Promise<Category> {
    try {
      this.logger.log(`Updating category with id: ${id}`);
      const result = await this.categoryRepository.update(id, category);

      if (result.affected === 0) {
        this.logger.warn(`Category with ID ${id} not found for update`);
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      return this.findCategoryById(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Failed to update category ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to update category: ${error.message}`,
      );
    }
  }

  /**
   * Remove category by id
   * @param id The category ID to remove
   */
  async removeCategory(id: number): Promise<void> {
    try {
      this.logger.log(`Removing category with id: ${id}`);
      const result = await this.categoryRepository.delete(id);

      if (result.affected === 0) {
        this.logger.warn(`Category with ID ${id} not found for deletion`);
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Failed to remove category ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to remove category: ${error.message}`,
      );
    }
  }

  /**
   * Upsert category by source ID
   * @param sId The source ID to upsert by
   * @param data The category data to upsert
   * @returns The created or updated category
   */
  async upsertCategoryBySourceId(
    sId: string,
    data: Category,
  ): Promise<Category> {
    try {
      this.logger.log(`Upserting category with source ID: ${sId}`);

      if (!sId) {
        throw new BadRequestException(
          'Source ID is required for upserting a category',
        );
      }

      const existingCategory = await this.categoryRepository.findOneBy({ sId });

      if (existingCategory) {
        this.logger.debug(`Updating existing category: ${existingCategory.id}`);
        await this.categoryRepository.update(existingCategory.id, {
          ...data,
          updatedAt: new Date(),
        });
        return this.findCategoryById(existingCategory.id);
      } else {
        this.logger.debug(`Creating new category for source ID: ${sId}`);
        const newCategory = this.categoryRepository.create({
          ...data,
          sId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return await this.categoryRepository.save(newCategory);
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Error upserting category ${sId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to upsert category: ${error.message}`,
      );
    }
  }

  /**
   * Find category by source ID
   * @param sId The source ID to find
   * @returns The found category
   */
  async findCategoryBySourceId(sId: string): Promise<Category> {
    try {
      this.logger.log(`Fetching category with source ID: ${sId}`);

      if (!sId) {
        throw new BadRequestException('Source ID is required');
      }

      const category = await this.categoryRepository.findOneBy({ sId });

      if (!category) {
        this.logger.warn(`Category with source ID ${sId} not found`);
        throw new NotFoundException(`Category with source ID ${sId} not found`);
      }

      return category;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to find category by source ID ${sId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to find category by source ID: ${error.message}`,
      );
    }
  }

  // Legacy method names for backward compatibility
  async create(category: Category): Promise<Category> {
    return this.createCategory(category);
  }

  async findAll(): Promise<Category[]> {
    return this.findAllCategories();
  }

  async findOne(id: number): Promise<Category> {
    return this.findCategoryById(id);
  }

  async update(id: number, category: Category): Promise<Category> {
    return this.updateCategory(id, category);
  }

  async remove(id: number): Promise<void> {
    return this.removeCategory(id);
  }

  async upsert(sId: string, data: Category): Promise<Category> {
    return this.upsertCategoryBySourceId(sId, data);
  }
}
