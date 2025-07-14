import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChunkQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page_size?: number;

  @ApiPropertyOptional({
    description: 'Filter chunks by code',
    example: 'PROP001',
  })
  @IsOptional()
  @IsString()
  code?: string;
}

export class CreateChunkDto {
  @ApiProperty({
    description: 'The code for the chunk',
    example: 'PROP002',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'The content of the chunk',
    example: 'This is a proposal chunk content',
  })
  @IsString()
  @IsNotEmpty()
  page_content: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the chunk',
    example: { source: 'document.pdf', page: 1, section: 'introduction' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateChunkDto {
  @ApiPropertyOptional({
    description: 'Updated content of the chunk',
    example: 'Updated proposal content',
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiProperty({
    description: 'Primary key of the chunk to update',
    example: 'PROP001_12345-abcd-ef67',
  })
  @IsString()
  pk: string;

  @ApiPropertyOptional({
    description: 'Updated metadata for the chunk',
    example: { source: 'document.pdf', page: 1, updated: true },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class ChunkResponseDto {
  @ApiProperty({
    description: 'Chunk ID',
    example: 'PROP001_12345-abcd-ef67',
  })
  id: string;

  @ApiProperty({
    description: 'Chunk code',
    example: 'PROP001',
  })
  code: string;

  @ApiProperty({
    description: 'Chunk content',
    example: 'This is the chunk content',
  })
  page_content: string;

  @ApiPropertyOptional({
    description: 'Chunk metadata',
    example: { source: 'document.pdf', page: 1 },
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  created_at: string;

  @ApiProperty({
    description: 'Update timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  updated_at: string;
}
