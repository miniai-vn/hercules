import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsDateString,
  IsArray,
} from 'class-validator';

export enum DepartmentSortBy {
  ID = 'id',
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  IS_PUBLIC = 'isPublic',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class DepartmentQueryDto {
  @ApiPropertyOptional({
    description: 'Search by department name',
    example: 'Marketing',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by shop ID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsOptional()
  @IsUUID()
  shopId?: string;

  @ApiPropertyOptional({
    description: 'Filter by public/private status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by user ID (departments that user belongs to)',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter departments created after this date',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @ApiPropertyOptional({
    description: 'Filter departments created before this date',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  @ApiPropertyOptional({
    description: 'Include soft deleted departments',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeDeleted?: boolean = false;

  @ApiPropertyOptional({
    description: 'Filter by multiple department IDs',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  ids?: number[];

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: DepartmentSortBy,
    example: DepartmentSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(DepartmentSortBy)
  sortBy?: DepartmentSortBy = DepartmentSortBy.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    example: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Include related entities',
    type: [String],
    example: ['users', 'channels', 'shop'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  include?: string[] = [];
}

export class DepartmentPaginationQueryDto extends DepartmentQueryDto {
  @ApiPropertyOptional({
    description: 'Skip pagination and return all results',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  all?: boolean = false;
}

export class DepartmentBulkQueryDto {
  @ApiPropertyOptional({
    description: 'Department IDs for bulk operations',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  ids: number[];

  @ApiPropertyOptional({
    description: 'Shop ID for bulk operations',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsOptional()
  @IsUUID()
  shopId?: string;
}

export class DepartmentStatsQueryDto {
  @ApiPropertyOptional({
    description: 'Shop ID for statistics',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsOptional()
  @IsUUID()
  shopId?: string;

  @ApiPropertyOptional({
    description: 'Date range start for statistics',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Date range end for statistics',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Group statistics by',
    enum: ['day', 'week', 'month', 'year'],
    example: 'month',
  })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'year'])
  groupBy?: 'day' | 'week' | 'month' | 'year' = 'month';
}
