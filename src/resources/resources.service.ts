import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatedResult } from 'src/common/types/reponse.type';
import {
  FindManyOptions,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { CreateResourceDto, ResourceQueryDto } from './dto/resources.dto';
import { Resource } from './resources.entity';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
  ) {}

  async query(query: ResourceQueryDto): Promise<PaginatedResult<Resource>> {
    const {
      createdAfter,
      createdBefore,
      search,
      type,
      status,
      isActive,
      departmentId,
      page = 1,
      limit = 20,
      includeDeleted = false,
    } = query;

    const filter: FindManyOptions<Resource> = {
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
        ...(type && { type }),
        ...(status && { status }),
        ...(isActive !== undefined && { isActive }),
        ...(departmentId && { department: { id: departmentId } }),
      },
      relations: {
        department: true,
      },
      take: limit,
      skip: (page - 1) * limit,
      withDeleted: includeDeleted,
      order: {
        createdAt: 'DESC',
      },
    };

    const [data, total] = await this.resourceRepository.findAndCount(filter);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }

  async create(data: CreateResourceDto): Promise<Resource> {
    try {
      const resource = this.resourceRepository.create({
        ...data,
        department: { id: data.departmentId },
      });
      return await this.resourceRepository.save(resource);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create resource',
        error.message,
      );
    }
  }

  async findOne(id: number): Promise<Resource | null> {
    return this.resourceRepository.findOne({
      where: { id },
      relations: {
        department: true,
      },
    });
  }

  async update(id: number, data: Partial<Resource>): Promise<Resource | null> {
    try {
      await this.resourceRepository.update(id, data);
      return this.findOne(id);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update resource',
        error.message,
      );
    }
  }

  async eltData({
    shopId,
    url,
    type,
    resourceId,
  }: {
    shopId: string;
    url: string;
    type: string;
    resourceId?: number;
  }) {
    // handle call to chatservice to extraction data
  }
}
