import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../departments/departments.entity';
import { DepartmentsService } from '../departments/departments.service';
import { Channel } from './channels.entity';
import {
  ChannelBulkDeleteDto,
  ChannelQueryParamsDto,
  ChannelType,
  CreateChannelDto,
  PaginatedChannelsDto,
  UpdateChannelDto,
  UpdateChannelStatusDto,
} from './dto/channel.dto';
import { OAService } from './oa/oa.service';

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);

  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @Inject(forwardRef(() => DepartmentsService))
    private readonly departmentsService: DepartmentsService,
    private readonly oaService: OAService, // Inject OAService
  ) {}

  async create(data: CreateChannelDto): Promise<Channel> {
    try {
      let department: Department | undefined | null = undefined;
      if (data.departmentId) {
        department = await this.departmentsService.findOne(data.departmentId);
        if (!department) {
          throw new NotFoundException(
            `Department with ID ${data.departmentId} not found`,
          );
        }
      }

      const channelToCreate = this.channelRepository.create({
        ...data,
        department: department || undefined, // Assign department entity or undefined
      });

      const newChannel = await this.channelRepository.save(channelToCreate);

      if (newChannel.type === ChannelType.ZALO && newChannel.extraData) {
        await this.oaService.sendChannelIdForMiniapp({
          id: newChannel.department.id,
          appId: (newChannel.extraData as any)?.app_id,
          oaId: (newChannel.extraData as any)?.oa_id,
        });
      }
      return newChannel;
    } catch (error) {
      this.logger.error(
        `Failed to create channel: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Failed to create channel',
        error.message,
      );
    }
  }

  async getOne(id: number): Promise<Channel> {
    const channel = await this.channelRepository.findOne({
      where: { id },
      relations: ['department'],
    });
    if (!channel) {
      throw new NotFoundException(`Channel with ID ${id} not found`);
    }
    return channel;
  }

  async update(id: number, data: UpdateChannelDto): Promise<Channel> {
    try {
      const channel = await this.getOne(id); // Ensures channel exists and loads relations

      let department: Department | undefined | null = channel.department; // Keep existing if not changed
      if (data.departmentId && data.departmentId !== channel.department.id) {
        department = await this.departmentsService.findOne(data.departmentId);
        if (!department) {
          throw new NotFoundException(
            `Department with ID ${data.departmentId} not found`,
          );
        }
      } else if (data.departmentId === null) {
        // Explicitly setting department to null
        department = null;
      }

      // Merge new data into the existing channel entity
      // TypeORM's save method can handle partial updates if you load the entity first
      const updatedChannelData = {
        ...channel,
        ...data,
        department: department === undefined ? channel.department : department,
      };

      // delete departmentId from data to prevent TypeORM from trying to set it directly if department entity is also present
      const { departmentId, ...restOfData } = data;

      // Update the channel entity
      // Option 1: Merge and save
      // this.channelRepository.merge(channel, restOfData);
      // if (department !== undefined) { // if department was re-fetched or set to null
      //   channel.department = department;
      // }
      // const savedChannel = await this.channelRepository.save(channel);

      // Option 2: Use update method (doesn't run subscribers/listeners, returns UpdateResult)
      // For this conversion, to match Python's "refresh" behavior and return entity, we'll fetch after update.
      await this.channelRepository.update(id, {
        ...restOfData,
        department: department === undefined ? channel.department : department, // Pass the entity or null
      });
      const updatedChannel = await this.getOne(id); // Re-fetch to get the full entity with relations

      if (
        updatedChannel.type === ChannelType.ZALO &&
        updatedChannel.extraData
      ) {
        await this.oaService.sendChannelIdForMiniapp({
          id: updatedChannel.department.id,
          appId: (updatedChannel.extraData as any)?.app_id,
          oaId: (updatedChannel.extraData as any)?.oa_id,
        });
      }
      return updatedChannel;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to update channel ${id}`,
        error.message,
      );
    }
  }

  async delete(id: number): Promise<void> {
    const channel = await this.getOne(id); // Ensures channel exists
    if (channel.department.id) {
      // Check if departmentId exists before sending
      await this.oaService.sendStatusChannel({
        id: channel.department.id,
        status: 'inactive', // As per Python code
      });
    }
    await this.channelRepository.delete(id);
  }

  async bulkDelete(dto: ChannelBulkDeleteDto): Promise<{
    totalRequested: number;
    deletedCount: number;
    notFoundCount: number;
  }> {
    let deletedCount = 0;
    const notFoundIds: number[] = [];

    for (const channelId of dto.channelIds) {
      try {
        await this.delete(channelId); // Leverages the existing delete logic including OA call
        deletedCount++;
      } catch (error) {
        if (error instanceof NotFoundException) {
          notFoundIds.push(channelId);
        } else {
          this.logger.error(
            `Error deleting channel ${channelId} in bulk: ${error.message}`,
          );
          // Decide if one error should stop the whole bulk operation or just skip
        }
      }
    }
    return {
      totalRequested: dto.channelIds.length,
      deletedCount,
      notFoundCount: dto.channelIds.length - deletedCount,
    };
  }

  async getAll(): Promise<Channel[]> {
    // Python: stmt = select(Channel).join(Department).order_by(Department.name)
    return this.channelRepository
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.department', 'department')
      .orderBy('department.name', 'ASC') // Assuming Department entity has 'name'
      .getMany();
  }

  async query(params: ChannelQueryParamsDto): Promise<Channel[]> {
    const queryBuilder = this.channelRepository.createQueryBuilder('channel');

    if (params.name) {
      queryBuilder.andWhere('channel.name ILIKE :name', {
        name: `%${params.name}%`,
      });
    }
    if (params.type) {
      queryBuilder.andWhere('channel.type = :type', { type: params.type });
    }
    if (params.departmentId) {
      queryBuilder.andWhere('channel.departmentId = :departmentId', {
        departmentId: params.departmentId,
      });
    }
    if (params.apiStatus) {
      queryBuilder.andWhere('channel.apiStatus = :apiStatus', {
        apiStatus: params.apiStatus,
      });
    }
    // Assuming Channel entity has 'createdAt' field
    if (params.createdAfter && params.createdBefore) {
      queryBuilder.andWhere(
        'channel.createdAt BETWEEN :createdAfter AND :createdBefore',
        {
          createdAfter: params.createdAfter,
          createdBefore: params.createdBefore,
        },
      );
    } else {
      if (params.createdAfter) {
        queryBuilder.andWhere('channel.createdAt >= :createdAfter', {
          createdAfter: params.createdAfter,
        });
      }
      if (params.createdBefore) {
        queryBuilder.andWhere('channel.createdAt <= :createdBefore', {
          createdBefore: params.createdBefore,
        });
      }
    }
    queryBuilder.leftJoinAndSelect('channel.department', 'department'); // Ensure department is loaded

    return queryBuilder.getMany();
  }

  async getByDepartment(departmentId: number): Promise<Channel[]> {
    return this.channelRepository.find({
      where: {
        department: { id: departmentId },
      },
      relations: ['department'],
    });
  }

  async getByShopId(
    shopId: string,
    page: number = 1,
    perPage: number = 20,
    search: string = '',
  ): Promise<PaginatedChannelsDto> {
    const offset = (page - 1) * perPage;

    const queryBuilder = this.channelRepository
      .createQueryBuilder('channel')
      .leftJoin('channel.department', 'department') // Join department
      .where('department.shop_id = :shopId', { shopId }); // Filter by shopId on department

    if (search && search.trim()) {
      queryBuilder.andWhere('channel.name ILIKE :search', {
        search: `%${search.trim()}%`,
      });
    }

    const totalCount = await queryBuilder.getCount();

    const channels = await queryBuilder
      .select('channel') // Select only channel fields to avoid issues with distinct if not needed
      .addSelect(['department.id', 'department.name']) // Explicitly select department fields needed
      .orderBy('channel.id', 'DESC') // Add some default ordering
      .offset(offset)
      .limit(perPage)
      .getMany();
    // .getRawAndEntities(); // If you need raw data too or have complex selections

    const totalPages = Math.ceil(totalCount / perPage);

    return {
      items: channels,
      page,
      perPage,
      totalCount,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async updateStatus(
    id: number,
    dto: UpdateChannelStatusDto,
  ): Promise<Channel> {
    try {
      const channel = await this.getOne(id); // Ensures channel exists

      channel.status = dto.status; // Update the status field
      const updatedChannel = await this.channelRepository.save(channel);

      if (updatedChannel.department.id) {
        // Check if departmentId exists
        await this.oaService.sendStatusChannel({
          id: updatedChannel.department.id,
          status: updatedChannel.status,
        });
      }
      return updatedChannel;
    } catch (error) {
      this.logger.error(
        `Failed to update status for channel ${id}: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Failed to update status for channel ${id}`,
        error.message,
      );
    }
  }
}
