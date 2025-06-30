import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Producer } from 'kafkajs';
import { PaginatedResult } from 'src/common/types/reponse.type';
import {
  FindManyOptions,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import {
  CreateResourceDto,
  ResourceQueryDto,
  ResourceStatus,
} from './dto/resources.dto';
import { Resource } from './resources.entity';
import { KafkaProducerService } from 'src/kafka/kafka.producer';

@Injectable()
export class ResourcesService {
  private producer: Producer;
  constructor(
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
    private readonly kafkaProducerService: KafkaProducerService, // Assuming this is used for file uploads
  ) {
    this.producer = this.kafkaProducerService.getProducer();
  }

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

  async create(data: CreateResourceDto) {
    try {
      let resource = this.resourceRepository.create({
        ...data,
        status: ResourceStatus.PROCESSING,
        department: {
          id: data.departmentId,
        },
      });
      resource = await this.resourceRepository.save(resource);
      await this.producer.send({
        topic: 'mi9.etl.resource',
        messages: [
          {
            key: resource.id.toString(),
            value: JSON.stringify({
              id: resource.id,
              name: resource.name,
              key: resource.s3Key,
              type: resource.type,
              status: resource.status,
              isActive: resource.isActive,
              departmentId: resource.department?.id,
            }),
          },
        ],
      });

      return resource;
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
}
