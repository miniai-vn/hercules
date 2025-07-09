import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Producer } from 'kafkajs';
import { PaginatedResult } from 'src/common/types/reponse.type';
import { KafkaProducerService } from 'src/kafka/kafka.producer';
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
  UpdateResourceDto,
} from './dto/resources.dto';
import { Resource } from './resources.entity';
import { UploadsService } from 'src/uploads/uploads.service';

@Injectable()
export class ResourcesService {
  private producer: Producer;
  constructor(
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
    private readonly kafkaProducerService: KafkaProducerService,
    private readonly uploadsService: UploadsService,
  ) {
    this.producer = this.kafkaProducerService.getProducer();
  }

  generateCodeFromFilename = (filename: string) => {
    if (!filename || typeof filename !== 'string')
      throw new Error('Invalid filename');

    const removeVietnameseTones = (str) => {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^\w\s]/gi, '')
        .trim();
    };

    const cleaned = removeVietnameseTones(filename);

    const parts = cleaned.split(/\s+/);
    const initials = parts
      .map((word, index) => {
        if (index < parts.length - 1 && /^[A-Za-z]/.test(word))
          return word[0].toUpperCase();
        return word;
      })
      .join('');

    return initials;
  };

  async updateStatusByKey(key: string, status: ResourceStatus): Promise<void> {
    try {
      await this.resourceRepository.update({ s3Key: key }, { status });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update resource status',
        error.message,
      );
    }
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
        resources: true,
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

  async create(file: Express.Multer.File, data: CreateResourceDto) {
    try {
      if (!file) {
        throw new InternalServerErrorException('File is required');
      }

      const buffer = Buffer.from(file.originalname, 'latin1');
      const decodedName = buffer.toString('utf8').split('.')[0];

      const parentResource = await this.resourceRepository.findOne({
        where: { id: data.parentId },
        relations: {
          department: true,
        },
      });

      const code = this.generateCodeFromFilename(decodedName);
      const parrentCode = parentResource?.code ? parentResource.code : '';

      const dataFromFile = await this.uploadsService.uploadFile({
        file: {
          ...file,
          originalname: decodedName,
        },
        departmentId: data.departmentId,
        shopId: data.shopId,
        parentCode: parrentCode,
        code: code,
      });

      const resource = await this.resourceRepository.save({
        ...data,
        name: decodedName,
        status: ResourceStatus.PROCESSING,
        s3Key: dataFromFile.key,
        path: dataFromFile.url,
        type: dataFromFile.type,
        code: parrentCode ? parrentCode : '' + code,
        department: {
          id: data.departmentId,
        },
      });

      await this.producer.send({
        topic: process.env.KAFKA_ETL_TOPIC,
        messages: [
          {
            key: resource.id.toString(),
            value: JSON.stringify({
              id: resource.id,
              name: resource.name,
              s3Key: resource.s3Key,
              type: resource.type,
              status: resource.status,
              isActive: resource.isActive,
              departmentId: resource.department?.id,
              code: resource.code,
            }),
          },
        ],
      });

      return resource.code;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create resource',
        error.message,
      );
    }
  }

  async reEtlResource(id: number): Promise<Resource | null> {
    const resource = await this.resourceRepository.findOne({
      where: { id },
      relations: {
        department: true,
      },
    });
    if (!resource) {
      throw new InternalServerErrorException('Resource not found');
    }
    try {
      await this.producer.send({
        topic: process.env.KAFKA_ETL_TOPIC,
        messages: [
          {
            key: resource.id.toString(),
            value: JSON.stringify({
              id: resource.id,
              name: resource.name,
              s3Key: resource.s3Key,
              type: resource.type,
              status: resource.status,
              isActive: resource.isActive,
              departmentId: resource.department?.id,
              code: resource.code,
            }),
          },
        ],
      });
      await this.resourceRepository.update(id, {
        status: ResourceStatus.PROCESSING,
      });
      return resource;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to re-ETL resource',
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

  async update(id: number, data: UpdateResourceDto): Promise<Resource | null> {
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
