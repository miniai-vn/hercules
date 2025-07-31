import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
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
  channel = 'channel',
}

export enum MessageType {
  send = 'send',
  receive = 'receive',
}

// Base DTO with common message properties
export class MessageDto {
  @IsString()
  @IsOptional()
  senderType?: string;

  @IsString()
  @IsOptional()
  contentType?: string;

  @IsString()
  @IsOptional()
  content?: string;

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

  @IsString()
  @IsOptional()
  externalId?: string; // For external systems to reference this message

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  links?: string[]; // Array of file URLs or links associated with the message

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  createdAt?: Date;
}

// Create DTO extends MessageDto with required fields
export class CreateMessageDto extends MessageDto {
  @IsString()
  @IsNotEmpty()
  senderType: string;

  @IsString()
  @IsNotEmpty()
  contentType: string;

  @IsString()
  @IsNotEmpty()
  conversationId: string;
}

// Update DTO extends MessageDto (all fields optional for updates)
export class UpdateMessageDto extends MessageDto {
  // All fields are already optional from base MessageDto
  // No additional required fields needed for updates
}

export class MessageQueryParamsDto {
  @IsString()
  @IsOptional()
  senderType?: string;

  @IsString()
  @IsOptional()
  contentType?: string;

  @IsString()
  @IsOptional()
  search?: string; // For searching in content

  @IsString()
  @IsOptional()
  @Type(() => String)
  conversationId?: string;

  @IsString()
  @IsOptional()
  senderId?: string;

  @IsString()
  @IsOptional()
  createdAfter?: string; // ISO date string

  @IsString()
  @IsOptional()
  createdBefore?: string; // ISO date string

  @IsString()
  @IsOptional()
  includeDeleted?: string; // 'true' or 'false' to include soft-deleted messages

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number; // Number of results to return

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number; // Page number for pagination
}

export class MessageBulkDeleteDto {
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  messageIds: number[];
}

// Additional specialized DTOs extending MessageDto
export class UserMessageDto extends MessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  id: string; // Optional: ID for user messages, can be used for updates
}

export class ChannelMessageDto extends MessageDto {
  @IsString()
  @IsNotEmpty()
  id: string; // Optional: ID for channel messages, can be used for updates
}
