import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
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
  ZALO = 'Zalo',
  FACEBOOK = 'Facebook',
  TIKTOK = 'TikTok',
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
  url?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  audienceSize?: number;

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

  @IsObject()
  @IsOptional()
  authCredentials?: Record<string, any>;

  @IsObject()
  @IsOptional()
  extraData?: Record<string, any>; // e.g., { app_id: string, oa_id: string }

  @IsString()
  @IsOptional()
  apiStatus?: string;

  @IsInt()
  @IsOptional()
  departmentId?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  isUseProductFromMiniapp?: boolean;
}

export class UpdateChannelDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @IsEnum(ChannelType)
  @IsOptional()
  type?: ChannelType;

  @IsString()
  @IsOptional()
  url?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  audienceSize?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsString()
  @IsOptional()
  apiSecret?: string;

  @IsString()
  @IsOptional()
  accessToken?: string;

  @IsString()
  @IsOptional()
  refreshToken?: string;

  @IsObject()
  @IsOptional()
  authCredentials?: Record<string, any>;

  @IsObject()
  @IsOptional()
  extraData?: Record<string, any>;

  @IsString()
  @IsOptional()
  apiStatus?: string;

  @IsInt()
  @IsOptional()
  departmentId?: number;

  @IsString()
  @IsOptional()
  status?: string; // Added based on Python model and update_status method

  @IsBoolean()
  @IsOptional()
  isUseProductFromMiniapp?: boolean;
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
  apiStatus?: string;

  @IsDateString()
  @IsOptional()
  createdAfter?: string;

  @IsDateString()
  @IsOptional()
  createdBefore?: string;
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
}

export class UpdateChannelStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;
}
