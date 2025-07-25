import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ConversationType } from '../conversations.entity';

export { ConversationType };
export class ConversationDto {
  @ApiProperty({
    description: 'Unique identifier for the conversation',
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Name of the conversation',
    example: 'Support Chat',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Type of the conversation',
    enum: ConversationType,
    example: ConversationType.DIRECT,
  })
  @IsEnum(ConversationType)
  type: ConversationType;

  @ApiPropertyOptional({
    description: 'Avatar URL or path for the conversation',
    example: 'https://example.com/avatar.png',
  })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Content of the conversation',
    example: 'Welcome to our support chat!',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    description: 'Indicates if the conversation is a bot conversation',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isBot?: boolean;
}

export class UpdateConversationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(ConversationType)
  @IsOptional()
  type?: ConversationType;

  @IsString()
  @IsOptional()
  content?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  customerParticipantIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  userParticipantIds?: string[];

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  externalId?: string;
}

export class ConversationQueryParamsDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  participantUserIds?: string[];

  @ApiPropertyOptional({
    description: 'Conversation type',
    example: 'direct',
  })
  @IsOptional()
  @IsString()
  readStatus?: 'read' | 'unread' | 'all';

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Filter conversations by phone number',
    example: false,
  })
  phoneFilter?: boolean;

  @ApiPropertyOptional({
    description: 'Conversation name',
    example: 'Support Chat',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Channel ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  channelId?: number;

  @ApiPropertyOptional({
    description: 'User ID',
    example: 'user-uuid-123',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Search term for conversation name or content',
    example: 'help',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Channel type (e.g., Zalo, Facebook)',
    example: 'Zalo',
  })
  @IsOptional()
  @IsString()
  channelType?: string;

  @ApiPropertyOptional({
    description: 'Shop ID (automatically set from authenticated user)',
    example: 'shop-uuid-123',
  })
  @IsOptional()
  @IsString()
  shopId?: string;

  // New filter fields
  @ApiPropertyOptional({
    description: 'Filter by tag ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  tagId?: number;

  @ApiPropertyOptional({
    description:
      'Filter conversations created from this date (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  timeFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter conversations created to this date (ISO 8601 format)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  timeTo?: string;

  // Pagination
  @ApiPropertyOptional({
    description: 'Page number (starts from 1)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pageSize?: number = 10;
}

export class AddParticipantsDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  customerIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  userIds?: string[];
}
