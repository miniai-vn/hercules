import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { Customer } from './customers.entity';
import { ShopService } from '../shops/shops.service';
import { ChannelsService } from '../channels/channels.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerResponseDto,
  CustomerListQueryDto,
  CustomerListResponseDto,
} from './customers.dto';
import { TagsService } from 'src/tags/tags.service';

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

  async findAll(query: CustomerListQueryDto): Promise<CustomerListResponseDto> {
    const { platform, shopId, channelId, name, page = 1, limit = 10 } = query;

    const whereConditions: any = {};

    if (platform) {
      whereConditions.platform = platform;
    }

    if (shopId) {
      // Validate shop exists using ShopService
      await this.shopService.findOne(shopId);
      whereConditions.shop = { id: shopId };
    }

    if (channelId) {
      // Validate channel exists using ChannelService
      await this.channelService.getOne(channelId);
      whereConditions.channel = { id: channelId };
    }

    if (name) {
      whereConditions.name = Like(`%${name}%`);
    }

    const findOptions: FindManyOptions<Customer> = {
      where: whereConditions,
      relations: ['shop', 'channel'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    };

    const [customers, total] =
      await this.customerRepository.findAndCount(findOptions);

    const data = customers.map((customer) => this.mapToResponseDto(customer));
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
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
    avatar
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
