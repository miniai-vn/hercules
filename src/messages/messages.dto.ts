import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export enum SenderType {
  user = 'user',
  customer = 'customer',
  assistant = 'assistant',
}
export class CreateMessageDto {
  @IsString()
  senderType: string;

  @IsString()
  @IsNotEmpty()
  contentType: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsNumber()
  @IsNotEmpty()
  conversationId: number;

  @IsString()
  @IsOptional()
  senderId?: string;

  @IsString()
  @IsOptional()
  intent?: string;

  @IsObject()
  @IsOptional()
  extraData?: Record<string, any>;

  @IsObject()
  @IsOptional()
  tokenUsage?: Record<string, any>;
}

export class UpdateMessageDto {
  @IsString()
  senderType: string;

  @IsString()
  @IsOptional()
  contentType?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  intent?: string;

  @IsObject()
  @IsOptional()
  extraData?: Record<string, any>;

  @IsObject()
  @IsOptional()
  tokenUsage?: Record<string, any>;
}

export class MessageQueryParamsDto {
  @IsString()
  senderType: string;

  @IsString()
  @IsOptional()
  contentType?: string;

  @IsString()
  @IsOptional()
  search?: string; // For searching in content

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  conversationId?: number;

  @IsString()
  @IsOptional()
  intent?: string;

  @IsString()
  @IsOptional()
  createdAfter?: string; // ISO date string

  @IsString()
  @IsOptional()
  createdBefore?: string; // ISO date string

  @IsString()
  @IsOptional()
  includeDeleted?: string; // 'true' or 'false' to include soft-deleted messages
}

export class MessageBulkDeleteDto {
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  messageIds: number[];
}

export class PaginatedMessagesDto {
  messages: MessageResponseDto[];

  @IsNumber()
  total: number;

  @IsNumber()
  page: number;

  @IsNumber()
  perPage: number;

  @IsNumber()
  totalPages: number;
}

export class MessageResponseDto {
  id: number;
  senderType: string;
  contentType: string;
  content?: string;
  conversationId: number;
  intent?: string;
  extraData?: Record<string, any>;
  tokenUsage?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  // Optional: Include conversation details
  conversation?: {
    id: number;
    name: string;
    type: string;
  };
}

export class RestoreMessageDto {
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  messageIds: number[];
}

export class MessageStatsDto {
  totalMessages: number;
  messagesByType: Record<string, number>;
  messagesBySender: Record<string, number>;
  averageTokenUsage?: {
    input?: number;
    output?: number;
    total?: number;
  };
}

export class BulkCreateMessagesDto {
  @IsNumber()
  @IsNotEmpty()
  conversationId: number;

  messages: Omit<CreateMessageDto, 'conversationId'>[];
}

export class MessageWithConversationDto extends MessageResponseDto {
  conversation: {
    id: number;
    name: string;
    type: string;
    customerParticipants?: Array<{
      id: number;
      name?: string;
      externalId: string;
    }>;
    userParticipants?: Array<{
      id: string;
      name?: string;
      email?: string;
    }>;
  };
}
