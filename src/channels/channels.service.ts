import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConversationsService } from 'src/conversations/conversations.service';
import { Repository } from 'typeorm';
import { Department } from '../departments/departments.entity';
import { DepartmentsService } from '../departments/departments.service';
import { UsersService } from '../users/users.service';
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
import { Shop } from 'src/shops/shops.entity';

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);

  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @Inject(forwardRef(() => DepartmentsService))
    private readonly departmentsService: DepartmentsService,
    @Inject(forwardRef(() => ConversationsService))
    private readonly conversationsService: ConversationsService, // Inject ConversationsService if needed
    private readonly oaService: OAService, // Inject OAService
    private readonly usersService: UsersService, // Use UsersService instead of userRepository
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
      relations: {
        department: true,
        users: true, // Include users relation

        shop: true, // Include shop relation
      },
    });
    if (!channel) {
      throw new NotFoundException(`Channel with ID ${id} not found`);
    }
    return channel;
  }

  async update(id: number, data: UpdateChannelDto): Promise<Channel> {
    try {
      await this.channelRepository.update(id, data);
      return await this.getOne(id);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to update channel ${id}`,
        error.message,
      );
    }
  }

  async updateShopIdAllChannels(shopId: string): Promise<number> {
    return 0;
    // try {
    //   const result = await this.channelRepository.update(
    //     {},
    //     { shopId }, // Update all channels with the new shopId
    //   );
    //   return result.affected || 0; // Return number of affected rows
    // } catch (error) {
    //   this.logger.error(
    //     `Failed to update shopId for all channels: ${error.message}`,
    //     error.stack,
    //   );
    //   throw new InternalServerErrorException(
    //     'Failed to update shopId for all channels',
    //     error.message,
    //   );
    // }
  }

  async delete(id: number): Promise<void> {
    await this.channelRepository.softDelete(id);
  }

  async query(params: ChannelQueryParamsDto): Promise<Channel[]> {
    const queryBuilder = this.channelRepository
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.users', 'users')
      .where('channel.shop_id = :shopId', {
        shopId: params.shopId,
      })
      .andWhere('users.id = :userId', {
        userId: params.userId,
      });
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
  ): Promise<PaginatedChannelsDto> {
    const offset = (page - 1) * perPage;

    const queryBuilder = this.channelRepository
      .createQueryBuilder('channel')
      .leftJoin('channel.department', 'department')
      .where('channel.shop_id = :shopId', { shopId });

    const totalCount = await queryBuilder.getCount();

    const channels = await queryBuilder
      .select([
        'channel.id',
        'channel.name',
        'channel.type',
        'channel.status',
        'channel.createdAt',
        'channel.updatedAt',
        'channel.avatar',
      ])
      .leftJoinAndSelect('channel.users', 'users')
      .orderBy('channel.id', 'DESC')
      .where('channel.shop_id = :shopId', { shopId })

      .offset(offset)
      .limit(perPage)
      .getMany();

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
      const channel = await this.getOne(id);

      channel.status = dto.status;

      return await this.channelRepository.save(channel);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to update status for channel ${id}`,
        error.message,
      );
    }
  }

  async getByShopIdAndUserIdAndCountUnreadMessages(
    shopId: string,
    userId?: string,
  ) {
    const channels = await this.channelRepository.find({
      where: {
        shop: { id: shopId },
        ...(userId ? { users: { id: userId } } : {}),
      },
      relations: ['conversations'],
    });

    const channelsWithUnreadMessages = channels.map(async (channel) => {
      const conversationsWithUnreadMessages = await Promise.all(
        channel.conversations.map(async (conv) => {
          return {
            unreadMessagesCount:
              await this.conversationsService.getUnReadMessagesCount(
                conv.id,
                userId,
              ),
          };
        }),
      );
      const totalUnreadMessages = conversationsWithUnreadMessages.reduce(
        (acc, conv) => acc + conv.unreadMessagesCount,
        0,
      );

      return {
        ...channel,
        totalUnreadMessages,
      };
    });
    const channelsWithUnreadMessagesPromise = await Promise.all(
      channelsWithUnreadMessages,
    );

    const groupChannelsWithUnreadMessages = {};
    channelsWithUnreadMessagesPromise.forEach((channel) => {
      if (groupChannelsWithUnreadMessages[channel.type]) {
        groupChannelsWithUnreadMessages[channel.type] = {
          type: channel.type,
          totalUnreadMessages:
            channel.totalUnreadMessages + channel.totalUnreadMessages,
        };
      } else {
        groupChannelsWithUnreadMessages[channel.type] = {
          type: channel.type,
          totalUnreadMessages: channel.totalUnreadMessages,
        };
      }
    });

    // Convert the object to an array if needed
    const result = Object.values(groupChannelsWithUnreadMessages);
    return result;
  }

  // Add a single user to a channel
  async addUser(channelId: number, userId: string): Promise<Channel> {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
      relations: ['users'],
    });
    if (!channel) throw new NotFoundException('Channel not found');

    const user = await this.usersService.getOne(userId);
    if (!user) throw new NotFoundException('User not found');

    if (!channel.users) channel.users = [];
    // Prevent duplicates
    if (!channel.users.find((u) => u.id === user.id)) {
      channel.users.push(user);
      await this.channelRepository.save(channel);
    }
    return channel;
  }

  // Add multiple users to a channel
  async addUsers(channelId: number, userIds: string[]): Promise<Channel> {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
      relations: ['users'],
    });
    if (!channel) throw new NotFoundException('Channel not found');

    const users = await this.usersService.findByIds(userIds);
    if (!channel.users) channel.users = [];
    // Add only new users
    const existingUserIds = new Set(channel.users.map((u) => u.id));
    for (const user of users) {
      if (!existingUserIds.has(user.id)) {
        channel.users.push(user);
      }
    }
    await this.channelRepository.save(channel);
    return channel;
  }

  // Remove a single user from a channel
  async removeUser(channelId: number, userId: string): Promise<Channel> {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
      relations: ['users'],
    });
    if (!channel) throw new NotFoundException('Channel not found');
    if (!channel.users) return channel;
    channel.users = channel.users.filter((u) => u.id !== userId);
    await this.channelRepository.save(channel);
    return channel;
  }

  // Remove multiple users from a channel
  async removeUsers(channelId: number, userIds: string[]): Promise<Channel> {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
      relations: ['users'],
    });
    if (!channel) throw new NotFoundException('Channel not found');
    if (!channel.users) return channel;
    const removeSet = new Set(userIds);
    channel.users = channel.users.filter((u) => !removeSet.has(u.id));
    await this.channelRepository.save(channel);
    return channel;
  }

  async getByTypeAndAppId(type: ChannelType, appId: string): Promise<Channel> {
    return this.channelRepository.findOne({
      where: { type, appId, status: 'active' },
      relations: ['shop'],
    });
  }

  async updateShopId(
    shop: Shop,
    appId: string,
    userId: string,
  ): Promise<Channel> {
    const channel = await this.channelRepository.findOne({
      where: { appId },
      relations: ['users'],
    });

    const userExists = channel.users.some((user) => user.id === userId);
    if (!userExists) {
      const user = await this.usersService.getOne(userId);
      channel.users = [user];
    }
    channel.shop = shop;

    return this.channelRepository.save(channel);
  }

  async findByType(type: ChannelType): Promise<Channel[]> {
    return this.channelRepository.find({
      where: { type },
    });
  }
}
