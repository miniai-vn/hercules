import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsHexColor,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';

export enum TagType {
  CUSTOMER = 'customer',
  CONVERSATION = 'conversation',
}

export class CreateTagDto {
  @ApiProperty({
    description: 'Shop ID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsString()
  @IsUUID()
  shopId: string;

  @ApiProperty({ description: 'Tag name', example: 'VIP', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Type of tag',
    enum: TagType,
    example: TagType.CUSTOMER,
  })
  @IsEnum(TagType)
  type: TagType;

  @ApiPropertyOptional({
    description: 'Hex color code',
    example: '#6B7280',
    default: '#6B7280',
  })
  @IsOptional()
  @IsString()
  @Length(7, 7)
  @IsHexColor()
  color?: string = '#6B7280';

  @ApiPropertyOptional({
    description: 'Description',
    example: 'VIP customer tag',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateTagDto {
  @ApiPropertyOptional({
    description: 'Tag name',
    example: 'VIP',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Type of tag',
    enum: TagType,
    example: TagType.CUSTOMER,
  })
  @IsOptional()
  @IsEnum(TagType)
  type?: TagType;

  @ApiPropertyOptional({ description: 'Hex color code', example: '#6B7280' })
  @IsOptional()
  @IsString()
  @Length(7, 7)
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({
    description: 'Description',
    example: 'VIP customer tag',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class TagResponseDto {
  @ApiProperty({ description: 'Tag ID', example: 1 })
  id: number;

  @ApiProperty({
    description: 'Shop ID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  shopId: string;

  @ApiProperty({ description: 'Tag name', example: 'VIP' })
  name: string;

  @ApiProperty({
    description: 'Type of tag',
    enum: TagType,
    example: TagType.CUSTOMER,
  })
  type: TagType;

  @ApiProperty({ description: 'Hex color code', example: '#6B7280' })
  color: string;

  @ApiPropertyOptional({
    description: 'Description',
    example: 'VIP customer tag',
  })
  description?: string;

  @ApiProperty({
    description: 'Created at',
    example: '2024-06-07T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated at',
    example: '2024-06-07T12:00:00.000Z',
  })
  updatedAt: Date;
}

export class TagQueryParamsDto {
  @ApiPropertyOptional({
    description: 'Shop ID to filter tags',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  shopId?: string;

  @ApiPropertyOptional({ description: 'Search by tag name', example: 'VIP' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Type of tag',
    enum: TagType,
    example: TagType.CUSTOMER,
  })
  @IsOptional()
  @IsEnum(TagType)
  type?: TagType;
}

export class TagBulkDeleteDto {
  @ApiProperty({ description: 'Array of tag IDs to delete', type: [Number] })
  @IsNotEmpty({ each: true })
  @IsNumber({}, { each: true })
  tagIds: number[];
}
