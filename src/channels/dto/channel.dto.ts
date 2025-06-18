import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Channel } from '../channels.entity'; // Assuming Channel entity for PaginatedChannelsDto

export enum ChannelType {
  ZALO = 'zalo',
  FACEBOOK = 'facebook',
  TIKTOK = 'tikTok',
}

export class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsEnum(ChannelType)
  @IsNotEmpty()
  type: ChannelType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  appId: string;

  @IsString()
  @IsOptional()
  accessToken?: string;

  @IsString()
  @IsOptional()
  refreshToken?: string;

  @IsInt()
  @IsOptional()
  departmentId?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  isUseProductFromMiniapp?: boolean;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  expireTokenTime?: Date;

  @IsString()
  @IsOptional()
  userId?: string; // Comma-separated user IDs
}

export class UpdateChannelDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @IsString()
  @IsOptional()
  accessToken?: string;

  @IsString()
  @IsOptional()
  refreshToken?: string;

  @IsObject()
  @IsOptional()
  extraData?: Record<string, any>;

  @IsInt()
  @IsOptional()
  departmentId?: number;

  @IsString()
  @IsOptional()
  status?: string; // Added based on Python model and update_status method

  @IsBoolean()
  @IsOptional()
  isUseProductFromMiniapp?: boolean;

  @IsString()
  @IsOptional()
  shopId?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  expireTokenTime?: Date;
}

export class ChannelQueryParamsDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(ChannelType)
  @IsOptional()
  type?: ChannelType;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  departmentId?: number;

  @IsString()
  @IsOptional()
  shopId?: string;

  @IsString()
  @IsOptional()
  userId?: string;
}

export class ChannelBulkDeleteDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  channelIds: number[];
}

export class PaginatedChannelsDto {
  items: Channel[]; // Or a ChannelResponseDto if you transform data
  page: number;
  perPage: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  search?: string;
}

export class UpdateChannelStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;
}
