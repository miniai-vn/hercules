export interface ResourceQueryDto {
  search?: string;
  type?: string;
  status?: string;
  isActive?: boolean;
  departmentId?: number;
  createdAfter?: string;
  createdBefore?: string;
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum ResourceType {
  FILE = 'file',
  DOCUMENT = 'document',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  OTHER = 'other',
}

export enum ResourceStatus {
  NEW = 'new',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error',
  ARCHIVED = 'archived',
}

export class CreateResourceDto {
  @ApiProperty({
    description: 'Resource path',
    example: '/uploads/documents/file.pdf',
  })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiProperty({
    description: 'Resource name',
    example: 'Important Document.pdf',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Extra metadata as JSON',
    example: { size: 1024, mimetype: 'application/pdf' },
  })
  @IsOptional()
  extra?: Record<string, any>;

  @ApiProperty({
    description: 'Resource type',
    example: 'document',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({
    description: 'Resource description',
    example: 'This is an important document for the project',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Resource status',
    example: 'new',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    description: 'Department ID',
    example: 1,
  })
  @IsInt()
  @Type(() => Number)
  departmentId: number;

  @ApiPropertyOptional({
    description: 'Is resource active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateResourceDto {
  @ApiPropertyOptional({
    description: 'Resource name',
    example: 'Updated Document.pdf',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Extra metadata as JSON',
  })
  @IsOptional()
  extra?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Resource type',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Resource description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Resource status',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Is resource active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ResourcePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search by resource name',
    example: 'document',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by resource type',
    example: 'document',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Filter by resource status',
    example: 'completed',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by department ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number;

  @ApiPropertyOptional({
    description: 'Filter resources created after this date',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsString()
  createdAfter?: string;

  @ApiPropertyOptional({
    description: 'Filter resources created before this date',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsString()
  createdBefore?: string;

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Include soft deleted resources',
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
}
