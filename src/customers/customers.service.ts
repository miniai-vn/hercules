import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatedResult } from 'src/common/types/reponse.type';
import { TagsService } from 'src/tags/tags.service';
import { FindManyOptions, In, Like, Repository } from 'typeorm';
import { ChannelsService } from '../channels/channels.service';
import { ShopService } from '../shops/shops.service';
import {
  CreateCustomerDto,
  CustomerListQueryDto,
  CustomerResponseDto,
  UpdateCustomerDto,
} from './customers.dto';
import { Customer } from './customers.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly shopService: ShopService,
    @Inject(forwardRef(() => ChannelsService))
    private readonly channelService: ChannelsService,
    private readonly tagsService: TagsService,
  ) {}

  async create(
    createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    try {
      const { platform, externalId, name, shopId, channelId } =
        createCustomerDto;

      // Check if shop exists using ShopService
      let shop;
      try {
        shop = await this.shopService.findOne(shopId);
      } catch (error) {
        throw new BadRequestException(`Shop with ID ${shopId} not found`);
      }

      // Check if channel exists using ChannelService
      let channel;
      try {
        channel = await this.channelService.getOne(channelId);
      } catch (error) {
        throw new BadRequestException(`Channel with ID ${channelId} not found`);
      }

      // Check if customer with same platform and externalId already exists
      const existingCustomer = await this.customerRepository.findOne({
        where: { platform, externalId },
      });
      if (existingCustomer) {
        throw new ConflictException(
          `Customer with platform '${platform}' and external ID '${externalId}' already exists`,
        );
      }

      // Create new customer
      const customer = this.customerRepository.create({
        platform,
        externalId,
        name,
        shop,
        channel,
      });

      const savedCustomer = await this.customerRepository.save(customer);
      return this.mapToResponseDto(savedCustomer);
    } catch (error) {
      // Re-throw known errors
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      // Handle unexpected errors
      throw new InternalServerErrorException(
        `Failed to create customer: ${error.message}`,
      );
    }
  }

  async query(query: CustomerListQueryDto): Promise<PaginatedResult<Customer>> {
    const { page = 1, limit = 10 } = query;

    const whereConditions = {
      ...(query.search && {
        name: Like(`%${query.search}%`),
      }),
      ...(query.shopId && { shop: { id: query.shopId } }),
      ...(query.channelId && { channel: { id: query.channelId } }),
      ...(query.platform && { platform: query.platform }),
      ...(query.email && { email: query.email }),
      ...(query.phone && { phone: query.phone }),
      ...(query.address && { address: query.address }),
      ...(query.tagIds && { tags: { id: In(query.tagIds) } }),
    };

    const findOptions: FindManyOptions<Customer> = {
      where: whereConditions,
      relations: ['shop', 'channel'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    };

    const [customers, total] =
      await this.customerRepository.findAndCount(findOptions);

    return {
      data: customers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }

  async findOne(id: string) {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['shop', 'channel', 'tags'],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    try {
      const { name, address, avatar, phone, note, email } = updateCustomerDto;
      const customer = await this.customerRepository.findOne({
        where: { id },
        relations: ['shop', 'channel'],
      });

      const updatedCustomer = await this.customerRepository.save({
        ...customer,
        ...(email && { email }),
        ...(name && { name }),
        ...(address && { address }),
        ...(avatar && { avatar }),
        ...(phone && { phone }),
        ...(note && { note }),
      });

      return this.mapToResponseDto(updatedCustomer);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to update customer with ID ${id}: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<void> {
    const customer = await this.customerRepository.findOne({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    await this.customerRepository.remove(customer);
  }

  async findByPlatform(platform: string): Promise<Customer[]> {
    return this.customerRepository.find({
      where: { platform },
      relations: ['shop', 'channel'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOrCreateByExternalId({
    platform,
    externalId,
    name,
    shopId,
    channelId,
    avatar,
  }: {
    platform: string;
    externalId: string;
    name: string;
    shopId?: string;
    channelId?: number;
    avatar?: string;
  }) {
    await this.customerRepository.upsert(
      {
        platform,
        externalId,
        name,
        avatar,
        shop: shopId ? { id: shopId } : null,
        channel: channelId ? { id: channelId } : null,
      },
      {
        conflictPaths: ['externalId'],
        skipUpdateIfNoValuesChanged: true,
      },
    );

    return await this.customerRepository.findOne({
      where: { platform, externalId },
    });
  }

  async addTagsToCustomer(
    customerId: string,
    tagIds: number[],
  ): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
      relations: ['tags'],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    // Fetch tags by IDs
    const tags = await this.tagsService.findByIds(tagIds);

    // Add tags to customer
    customer.tags = tags;

    const updatedCustomer = await this.customerRepository.save(customer);
    return this.mapToResponseDto(updatedCustomer);
  }

  async findByExternalId(platform: string, externalId: string) {
    return await this.customerRepository.findOne({
      where: { externalId },
    });
  }

  async createMany(customers: CreateCustomerDto[]) {
    return await this.customerRepository.upsert(
      customers.map((customer) => ({
        platform: customer.platform,
        externalId: customer.externalId,
        avatar: customer.avatar,
        name: customer.name,
        shop: customer.shopId ? { id: customer.shopId } : null,
        channel: customer.channelId ? { id: customer.channelId } : null,
      })),
      {
        conflictPaths: ['externalId'],
        skipUpdateIfNoValuesChanged: true,
      },
    );
  }

  private mapToResponseDto(customer: Customer): CustomerResponseDto {
    return {
      id: customer.id,
      email: customer.email,
      platform: customer.platform,
      externalId: customer.externalId,
      name: customer.name,
      shopId: customer.shop?.id,
      channelId: customer.channel?.id,
      shop: customer.shop
        ? {
            id: customer.shop.id,
            name: customer.shop.name,
          }
        : null,
      channel: customer.channel
        ? {
            id: customer.channel.id,
            name: customer.channel.name,
          }
        : null,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}
