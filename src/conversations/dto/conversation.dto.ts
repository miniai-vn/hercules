import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  IsBoolean,
  isNumber,
} from 'class-validator';
import { ConversationType } from '../conversations.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export { ConversationType };

export class CreateConversationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(ConversationType)
  type: ConversationType;

  @IsString()
  @IsOptional()
  externalId?: string;

  @IsString()
  @IsNotEmpty()
  avatar?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsNumber()
  @IsOptional()
  channelId?: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  customerParticipantIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  userParticipantIds?: string[];
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
  limit?: number = 10;
}

export class AddTagsToConversationDto {
  @ApiProperty({
    description: 'Array of tag IDs to add to the conversation',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty({ each: true })
  tagIds: number[];
}

export class ConversationBulkDeleteDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  conversationIds: number[];
}

export class PaginatedConversationsDto {
  conversations: ConversationResponseDto[];

  @IsNumber()
  total: number;

  @IsNumber()
  page: number;

  @IsNumber()
  perPage: number;

  @IsNumber()
  totalPages: number;
}

export class ConversationResponseDto {
  id: number;
  name: string;
  type: ConversationType;
  avatar?: string; // Optional: avatar URL or path
  content?: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: {
    id: number;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    senderId: string; // ID of the user or customer who sent the message
  }[]; // Optional: array of messages in conversation
  customerParticipants?: {
    id: number;
    name?: string;
    externalId?: string;
  }[];
  userParticipants?: {
    id: string;
    name?: string;
    email?: string;
  }[];
  messagesCount?: number; // Optional: count of messages in conversation
  lastestMessage?: string;
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

export class RemoveParticipantsDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  customerIds?: number[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  userIds?: string[];
}
