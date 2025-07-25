import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString
} from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({
    description: 'Department name',
    example: 'Customer Support',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Department description',
    example: 'Handles customer inquiries and support requests',
    minLength: 1,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Shop ID that this department belongs to',
    example: '1',
  })
  @IsOptional()
  @IsString()
  shopId: string;

  @ApiPropertyOptional({
    description: 'Array of channel IDs to assign to this department',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  channelIds?: number[];


  @ApiPropertyOptional({
    description: 'Array of agent IDs to assign to this department',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  agentIds?: number[];

  @ApiPropertyOptional({
    description: 'Array of resource IDs to assign to this department',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  resourceIds?: number[];
}
