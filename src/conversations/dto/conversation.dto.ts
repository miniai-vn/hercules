import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ConversationType } from '../conversations.entity';

export { ConversationType };

export class CreateConversationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(ConversationType)
  type: ConversationType;

  @IsString()
  @IsOptional()
  content?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  customerParticipantIds?: number[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  userParticipantIds?: string[]; // Assuming User ID is UUID string
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
  customerParticipantIds?: number[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  userParticipantIds?: string[];
}

export class ConversationQueryParamsDto {
  @IsString()
  shopId: string; // Shop ID to filter conversationsw

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(ConversationType)
  @IsOptional()
  type?: ConversationType;

  @IsString()
  @IsOptional()
  search?: string; // For searching in name or content

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  customerParticipantId?: number; // Filter by specific customer participant

  @IsString()
  @IsOptional()
  userParticipantId?: string; // Filter by specific user participant

  @IsString()
  @IsOptional()
  createdAfter?: string; // ISO date string

  @IsString()
  @IsOptional()
  createdBefore?: string; // ISO date string
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
  content?: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: {
    id: number;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    senderId: number; // ID of the user or customer who sent the message
  }[]; // Optional: array of messages in conversation
  customerParticipants?: {
    id: number;
    name?: string;
    externalId: string;
  }[];
  userParticipants?: {
    id: string;
    name?: string;
    email?: string;
  }[];
  messagesCount?: number; // Optional: count of messages in conversation
}

export class AddParticipantsDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  customerIds?: number[];

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
