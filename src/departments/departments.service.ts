import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './departments.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  async create(data: Partial<Department>): Promise<Department> {
    try {
      const department = this.departmentRepository.create(data);
      return await this.departmentRepository.save(department);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create department',
        error.message,
      );
    }
  }

  async findAll(): Promise<Department[]> {
    return this.departmentRepository.find();
  }

  async findOne(id: number): Promise<Department | null> {
    return this.departmentRepository.findOne({ where: { id } });
  }

  async update(
    id: number,
    data: Partial<Department>,
  ): Promise<Department | null> {
    try {
      await this.departmentRepository.update(id, data);
      return this.findOne(id);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update department',
        error.message,
      );
    }
  }

  async remove(id: number): Promise<void> {
    await this.departmentRepository.softDelete(id);
  }
}
