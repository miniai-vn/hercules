import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  Repository,
  ILike,
  MoreThanOrEqual,
  LessThanOrEqual,
} from 'typeorm';
import { Department } from './departments.entity';
import { DepartmentPaginationQueryDto } from './dto/departments.dto';
import { PaginatedResult } from 'src/common/types/reponse.type';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { ResourceStatus } from 'src/resources/dto/resources.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  async query(
    query: DepartmentPaginationQueryDto,
  ): Promise<PaginatedResult<Department & { syncStatus: boolean }>> {
    const {
      createdAfter,
      createdBefore,
      search,
      page = 1,
      limit = 20,
      includeDeleted = false,
      shopId,
      userId,
    } = query;
    const filter: FindManyOptions<Department> = {
      where: {
        ...(createdAfter && {
          createdAt: MoreThanOrEqual(new Date(createdAfter)),
        }),
        ...(createdBefore && {
          createdAt: LessThanOrEqual(new Date(createdBefore)),
        }),
        ...(search && {
          name: ILike(`%${search}%`),
        }),
        ...(shopId && { shopId }),
        ...(userId && { userId }),
      },
      relations: {
        shop: true,
        users: true,
        resources: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        resources: {
          status: true,
        },
      },
      take: limit,
      skip: (page - 1) * limit,
      withDeleted: includeDeleted,
    };
    const [data, total] = await this.departmentRepository.findAndCount(filter);

    return {
      data: data.map((department) => {
        return {
          ...department,
          syncStatus: department.resources.some(
            (src) => src.status !== ResourceStatus.COMPLETED,
          ),
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }

  async create(data: CreateDepartmentDto): Promise<Department> {
    try {
      const department = this.departmentRepository.create({
        ...data,
        shop: { id: data.shopId.toString() },
      });
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

  async delete(id: number) {
    try {
      await this.departmentRepository.softDelete(id);
      return id;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to delete department',
        error.message,
      );
    }
  }
}
