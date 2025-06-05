import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Platform {
  ZALO = 'zalo',
  FACEBOOK = 'facebook',
  TIKTOK = 'tiktok',
}

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Platform name',
    enum: Platform,
    example: 'zalo',
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(Platform)
  platform: string;

  @ApiProperty({
    description: 'Customer ID from the external platform',
    example: 'zalo_user_123456',
  })
  @IsString()
  @IsNotEmpty()
  externalId: string;

  @ApiPropertyOptional({
    description: 'Customer name',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Shop ID that the customer belongs to',
    example: '0f2faa9a-2eda-4b32-81ee-e6bdb7d36fe3',
  })
  @IsString()
  @IsNotEmpty()
  shopId: string;

  @ApiProperty({
    description: 'Channel ID that the customer belongs to',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  channelId: number;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional({
    description: 'Platform name',
    enum: Platform,
    example: 'facebook',
  })
  @IsString()
  @IsOptional()
  @IsEnum(Platform)
  platform?: string;

  @ApiPropertyOptional({
    description: 'Customer ID from the external platform',
    example: 'fb_user_789012',
  })
  @IsString()
  @IsOptional()
  externalId?: string;

  @ApiPropertyOptional({
    description: 'Customer name',
    example: 'Jane Smith',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Shop ID that the customer belongs to',
    example: '0f2faa9a-2eda-4b32-81ee-e6bdb7d36fe3',
  })
  @IsString()
  @IsOptional()
  shopId?: string;

  @ApiPropertyOptional({
    description: 'Channel ID that the customer belongs to',
    example: 2,
  })
  @IsNumber()
  @IsOptional()
  channelId?: number;
}

export class CustomerResponseDto {
  @ApiProperty({
    description: 'Customer ID',
    example: 1,
  })
  id: string;

  @ApiProperty({
    description: 'Platform name',
    example: 'zalo',
  })
  platform: string;

  @ApiProperty({
    description: 'Customer ID from the external platform',
    example: 'zalo_user_123456',
  })
  externalId: string;

  @ApiProperty({
    description: 'Customer name',
    example: 'John Doe',
    nullable: true,
  })
  name?: string;

  @ApiProperty({
    description: 'Shop ID that the customer belongs to',
    example: '0f2faa9a-2eda-4b32-81ee-e6bdb7d36fe3',
  })
  shopId: string;

  @ApiProperty({
    description: 'Channel ID that the customer belongs to',
    example: 1,
    nullable: true,
  })
  channelId?: number;

  @ApiProperty({
    description: 'Shop information',
    type: 'object',
    nullable: true,
    properties: {
      id: { type: 'string', description: 'Shop ID' },
      name: { type: 'string', description: 'Shop name' },
      email: { type: 'string', description: 'Shop email', nullable: true },
    },
    additionalProperties: false,
  })
  shop?: {
    id: string;
    name: string;
    email?: string;
  };

  @ApiProperty({
    description: 'Channel information',
    type: 'object',
    nullable: true,
    properties: {
      id: { type: 'number', description: 'Channel ID' },
      name: { type: 'string', description: 'Channel name' },
      platform: { type: 'string', description: 'Platform', nullable: true },
    },
    additionalProperties: false,
  })
  channel?: {
    id: number;
    name: string;
    platform?: string;
  };

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-06-04T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-06-04T12:00:00Z',
  })
  updatedAt: Date;
}

export class CustomerListQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by platform',
    enum: Platform,
    example: 'zalo',
  })
  @IsOptional()
  @IsEnum(Platform)
  platform?: string;

  @ApiPropertyOptional({
    description: 'Filter by shop ID',
    example: '0f2faa9a-2eda-4b32-81ee-e6bdb7d36fe3',
  })
  @IsOptional()
  @IsString()
  shopId?: string;

  @ApiPropertyOptional({
    description: 'Filter by channel ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  channelId?: number;

  @ApiPropertyOptional({
    description: 'Search by name',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  limit?: number = 10;
}

export class CustomerListResponseDto {
  @ApiProperty({
    description: 'List of customers',
    type: [CustomerResponseDto],
  })
  data: CustomerResponseDto[];

  @ApiProperty({
    description: 'Total number of customers',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Current page',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 10,
  })
  totalPages: number;
}

export class FindCustomerByExternalIdDto {
  @ApiProperty({
    description: 'Platform name',
    enum: Platform,
    example: 'zalo',
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(Platform)
  platform: string;

  @ApiProperty({
    description: 'Customer ID from the external platform',
    example: 'zalo_user_123456',
  })
  @IsString()
  @IsNotEmpty()
  externalId: string;
}
