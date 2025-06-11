import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import {
  CreateTagDto,
  TagBulkDeleteDto,
  TagQueryParamsDto,
  TagResponseDto,
  UpdateTagDto,
  TagType,
} from './dto/tag.dto';
import { Tag } from './tags.entity';
import { ShopService } from 'src/shops/shops.service';

@Injectable()
export class TagsService {
  CUSTOMER_TAGS = [
    {
      name: 'Khách hàng VIP',
      color: '#EF4444',
      description: 'Khách hàng VIP cần được ưu tiên phục vụ',
      type: TagType.CUSTOMER,
    },
    {
      name: 'Khách hàng mới',
      color: '#10B981',
      description: 'Khách hàng lần đầu mua hàng',
      type: TagType.CUSTOMER,
    },
    {
      name: 'Khách hàng thường',
      color: '#6B7280',
      description: 'Khách hàng thông thường',
      type: TagType.CUSTOMER,
    },
    {
      name: 'Khách hàng tiềm năng',
      color: '#3B82F6',
      description: 'Khách hàng có khả năng mua hàng cao',
      type: TagType.CUSTOMER,
    },
  ];

  CONVERSATION_TAGS = [
    {
      name: 'Khẩn cấp',
      color: '#DC2626',
      description: 'Cần xử lý ngay lập tức',
      type: TagType.CONVERSATION,
    },
    {
      name: 'Đang xử lý',
      color: '#F97316',
      description: 'Đang trong quá trình xử lý',
      type: TagType.CONVERSATION,
    },
    {
      name: 'Đã xử lý',
      color: '#059669',
      description: 'Đã hoàn thành xử lý',
      type: TagType.CONVERSATION,
    },
  ];

  ALL_BASIC_TAGS = [...this.CUSTOMER_TAGS, ...this.CONVERSATION_TAGS];

  TAG_COLORS = {
    RED: '#EF4444',
    GREEN: '#10B981',
    GRAY: '#6B7280',
    BLUE: '#3B82F6',
    DARK_RED: '#DC2626',
    ORANGE: '#F97316',
    DARK_GREEN: '#059669',
  };

  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    private readonly shopsService: ShopService,
  ) {}

  async initBasicTags(shopId: string): Promise<TagResponseDto[]> {
    try {
      const shop = await this.shopsService.findOne(shopId);
      if (!shop) throw new NotFoundException('Shop not found');

      const existingTags = await this.tagRepository.find({
        where: { shop },
        select: ['name', 'type'],
      });
      const existingTagKeys = new Set(
        existingTags.map((tag) => `${tag.name}:${tag.type}`),
      );

      const tagsToCreate = this.ALL_BASIC_TAGS.filter(
        (tag) => !existingTagKeys.has(`${tag.name}:${tag.type}`),
      );

      const newTags: Tag[] = [];
      for (const tagData of tagsToCreate) {
        const tag = this.tagRepository.create({
          shop,
          name: tagData.name,
          color: tagData.color,
          description: tagData.description,
          type: tagData.type,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        newTags.push(tag);
      }

      if (newTags.length > 0) {
        await this.tagRepository.save(newTags);
      }

      const allTags = await this.tagRepository.find({
        where: { shop },
        order: { createdAt: 'ASC' },
      });
      return allTags.map((tag) => this.toResponseDto(tag));
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to initialize basic tags: ${error.message}`,
      );
    }
  }

  async create(createTagDto: CreateTagDto): Promise<TagResponseDto> {
    try {
      const shop = await this.shopsService.findOne(createTagDto.shopId);
      if (!shop) throw new NotFoundException('Shop not found');

      const tag = this.tagRepository.create({
        shop,
        name: createTagDto.name,
        color: createTagDto.color ?? '#6B7280',
        description: createTagDto.description,
        type: createTagDto.type,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const saved = await this.tagRepository.save(tag);
      return this.toResponseDto(saved);
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException(
          'Tag name must be unique per shop and type',
        );
      }
      throw new InternalServerErrorException(
        `Failed to create tag: ${error.message}`,
      );
    }
  }

  async findByIds(ids: number[]): Promise<Tag[]> {
    try {
      return await this.tagRepository.find({
        where: { id: In(ids) },
        relations: ['shop'],
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get tags by IDs: ${error.message}`,
      );
    }
  }

  async findByShopId(shopId: string): Promise<TagResponseDto[]> {
    try {
      const shop = await this.shopsService.findOne(shopId);

      const tags = await this.tagRepository.find({
        where: { shop },
        order: { createdAt: 'DESC' },
      });
      return tags.map((tag) => this.toResponseDto(tag));
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get tags by shop ID: ${error.message}`,
      );
    }
  }

  async findAll(query: TagQueryParamsDto): Promise<TagResponseDto[]> {
    try {
      const where: any = {};
      if (query.shopId) where.shop = { id: query.shopId };
      if (query.name) where.name = ILike(`%${query.name}%`);
      if (query.type) where.type = query.type;

      const tags = await this.tagRepository.find({
        where,
        relations: ['shop'],
        order: { createdAt: 'DESC' },
      });
      return tags.map((tag) => this.toResponseDto(tag));
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get tags: ${error.message}`,
      );
    }
  }

  async findOne(id: number): Promise<TagResponseDto> {
    try {
      const tag = await this.tagRepository.findOne({
        where: { id },
        relations: ['shop'],
      });
      if (!tag) throw new NotFoundException('Tag not found');
      return this.toResponseDto(tag);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get tag: ${error.message}`,
      );
    }
  }

  async update(
    id: number,
    updateTagDto: UpdateTagDto,
  ): Promise<TagResponseDto> {
    try {
      const tag = await this.tagRepository.findOne({
        where: { id },
        relations: ['shop'],
      });
      if (!tag) throw new NotFoundException('Tag not found');

      if (updateTagDto.name !== undefined) tag.name = updateTagDto.name;
      if (updateTagDto.color !== undefined) tag.color = updateTagDto.color;
      if (updateTagDto.description !== undefined)
        tag.description = updateTagDto.description;
      if (updateTagDto.type !== undefined) tag.type = updateTagDto.type;
      tag.updatedAt = new Date();

      const saved = await this.tagRepository.save(tag);
      return this.toResponseDto(saved);
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException(
          'Tag name must be unique per shop and type',
        );
      }
      throw new InternalServerErrorException(
        `Failed to update tag: ${error.message}`,
      );
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const tag = await this.tagRepository.findOne({ where: { id } });
      if (!tag) throw new NotFoundException('Tag not found');
      await this.tagRepository.remove(tag);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to remove tag: ${error.message}`,
      );
    }
  }

  async bulkDelete(dto: TagBulkDeleteDto): Promise<{ deleted: number }> {
    try {
      const tags = await this.tagRepository.findByIds(dto.tagIds);
      if (!tags.length) return { deleted: 0 };
      await this.tagRepository.remove(tags);
      return { deleted: tags.length };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to bulk delete tags: ${error.message}`,
      );
    }
  }

  private toResponseDto(tag: Tag): TagResponseDto {
    return {
      id: tag.id,
      shopId: tag.shop?.id,
      name: tag.name,
      color: tag.color,
      description: tag.description,
      type: tag.type as TagType,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };
  }
}
