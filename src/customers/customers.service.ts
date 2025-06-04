import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { Customer } from './customers.entity';
import { ShopService } from '../shops/shops.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerResponseDto,
  CustomerListQueryDto,
  CustomerListResponseDto,
} from './customers.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly shopService: ShopService,
  ) {}

  async create(
    createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const { platform, externalId, name, shopId } = createCustomerDto;

    // Check if shop exists using ShopService
    const shop = await this.shopService.findOne(shopId);
    if (!shop) {
      throw new BadRequestException(`Shop with ID ${shopId} not found`);
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
    });

    const savedCustomer = await this.customerRepository.save(customer);
    return this.mapToResponseDto(savedCustomer);
  }

  async findAll(query: CustomerListQueryDto): Promise<CustomerListResponseDto> {
    const { platform, shopId, name, page = 1, limit = 10 } = query;

    const whereConditions: any = {};

    if (platform) {
      whereConditions.platform = platform;
    }

    if (shopId) {
      // Validate shop exists using ShopService
      await this.shopService.findOne(shopId);
      whereConditions.shop = { id: shopId };
    }

    if (name) {
      whereConditions.name = Like(`%${name}%`);
    }

    const findOptions: FindManyOptions<Customer> = {
      where: whereConditions,
      relations: ['shop'],
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

  async findOne(id: number): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['shop'],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return this.mapToResponseDto(customer);
  }

  async update(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const { platform, externalId, name, shopId } = updateCustomerDto;

    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['shop'],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Check if shop exists using ShopService (if shopId is provided)
    if (shopId && shopId !== customer.shop?.id) {
      const shop = await this.shopService.findOne(shopId);
      if (!shop) {
        throw new BadRequestException(`Shop with ID ${shopId} not found`);
      }
      customer.shop = shop;
    }

    // Check for duplicate platform + externalId (if either is being updated)
    if (platform || externalId) {
      const checkPlatform = platform || customer.platform;
      const checkExternalId = externalId || customer.externalId;

      const existingCustomer = await this.customerRepository.findOne({
        where: { platform: checkPlatform, externalId: checkExternalId },
      });

      if (existingCustomer && existingCustomer.id !== id) {
        throw new ConflictException(
          `Customer with platform '${checkPlatform}' and external ID '${checkExternalId}' already exists`,
        );
      }
    }

    // Update customer fields
    if (platform) customer.platform = platform;
    if (externalId) customer.externalId = externalId;
    if (name !== undefined) customer.name = name;

    const updatedCustomer = await this.customerRepository.save(customer);
    return this.mapToResponseDto(updatedCustomer);
  }

  async remove(id: number): Promise<void> {
    const customer = await this.customerRepository.findOne({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    await this.customerRepository.remove(customer);
  }

  async findByExternalId(
    platform: string,
    externalId: string,
  ): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { platform, externalId },
      relations: ['shop'],
    });

    if (!customer) {
      throw new NotFoundException(
        `Customer with platform '${platform}' and external ID '${externalId}' not found`,
      );
    }

    return this.mapToResponseDto(customer);
  }

  async findByPlatform(platform: string): Promise<Customer[]> {
    return this.customerRepository.find({
      where: { platform },
      relations: ['shop'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByShopId(shopId: string): Promise<Customer[]> {
    // Validate shop exists using ShopService
    await this.shopService.findOne(shopId);

    return this.customerRepository.find({
      where: { shop: { id: shopId } },
      relations: ['shop'],
      order: { createdAt: 'DESC' },
    });
  }

  async searchByName(searchTerm: string): Promise<Customer[]> {
    return this.customerRepository.find({
      where: { name: Like(`%${searchTerm}%`) },
      relations: ['shop'],
      order: { createdAt: 'DESC' },
    });
  }

  private mapToResponseDto(customer: Customer): CustomerResponseDto {
    return {
      id: customer.id,
      platform: customer.platform,
      externalId: customer.externalId,
      name: customer.name,
      shopId: customer.shop ? customer.shop.id : null,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}
