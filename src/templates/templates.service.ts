import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatedResult } from 'src/common/types/reponse.type';
import {
  Equal,
  FindManyOptions,
  In,
  IsNull,
  Like,
  Or,
  Repository,
} from 'typeorm';
import { CreateTemplateDto } from './dto/create.dto';
import { QueryParamsDto } from './dto/query-params.dto';
import { UpdateTemplateDto } from './dto/update.dto';
import { Template } from './templates.entity';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private templatesRepository: Repository<Template>,
  ) {}

  async query(query: QueryParamsDto): Promise<PaginatedResult<Template>> {
    const { limit = 10, page = 1, channelId, shopId, search } = query;
    const whereOperations: any = {
      where: {
        channel: channelId ? { id: channelId } : IsNull(),
        ...(shopId && { shop: Equal(shopId) }),
        ...(search && { name: Like(`%${search}%`) }),
      },
      skip: (page - 1) * limit,
      take: limit,
    };
    const [items, total] =
      await this.templatesRepository.findAndCount(whereOperations);
    return {
      data: items,
      total: total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
      hasNext: total > page * limit,
      hasPrev: page > 1,
    };
  }

  async create(data: CreateTemplateDto) {
    const template = this.templatesRepository.create({
      ...data,
      ...(data.channelId ? { channel: { id: data.channelId } } : {}),
      shop: {
        id: data.shopId,
      },
    });
    return this.templatesRepository.save(template);
  }

  async update(data: UpdateTemplateDto) {
    const template = await this.templatesRepository.findOneBy({ id: data.id });
    if (!template) {
      throw new Error('Template not found');
    }
    Object.assign(template, data);
    return this.templatesRepository.save(template);
  }

  async delete(id: string) {
    const template = await this.templatesRepository.findOneBy({ id });
    if (!template) {
      throw new Error('Template not found');
    }
    return this.templatesRepository.remove(template);
  }
}
