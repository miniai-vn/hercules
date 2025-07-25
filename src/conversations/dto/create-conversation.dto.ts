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
export class CreateConversationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsOptional()
  isBot?: boolean;

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

  @IsObject()
  @IsOptional()
  conversation?: {
    id: string; // Conversation ID
    timestamp: Date; // Timestamp of the conversation
  };

  @IsDateString()
  @IsOptional()
  lastMessageAt?: Date; // Timestamp of the last message in the conversation
}
