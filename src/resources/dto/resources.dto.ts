import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

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

export class ResourceDto {
  @ApiProperty({
    description: 'Resource path',
    example: '/uploads/documents/file.pdf',
  })
  @IsString()
  @IsOptional()
  path: string;

  @ApiProperty({
    description: 'Resource name',
    example: 'Important Document.pdf',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'S3 key for the resource',
    example: 'uploads/documents/file.pdf',
  })
  @IsOptional()
  @IsString()
  s3Key?: string;

  @ApiPropertyOptional({
    description: 'Extra metadata as JSON',
    example: { size: 1024, mimetype: 'application/pdf' },
  })
  @IsOptional()
  extra?: Record<string, any>;

  @ApiProperty({
    description: 'Resource type',
    example: 'document',
    enum: ResourceType,
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(ResourceType)
  type: ResourceType;

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
    enum: ResourceStatus,
    default: ResourceStatus.NEW,
  })
  @IsOptional()
  @IsString()
  @IsEnum(ResourceStatus)
  status?: ResourceStatus;

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
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  parentId?: number;

  @IsString()
  @IsOptional()
  shopId?: string;
  @IsString()
  @IsOptional()
  ext: string;
}

// For create operations - all required fields must be provided
export class CreateResourceDto extends ResourceDto {}

// For update operations - make required fields optional
export class UpdateResourceDto extends ResourceDto {
  @IsNumber()
  id: number;
}
