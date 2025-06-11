import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ParticipantType } from './conversation-members.entity';

/**
 * Member Settings DTO
 */
export class MemberSettingsDto {
  @ApiPropertyOptional({
    description: 'Enable notifications for this participant',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  notifications_enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Custom nickname for this member in the conversation',
    example: 'Sales Manager',
  })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({
    description: 'Role of the participant in the conversation',
    default: 'member',
    example: 'admin',
    enum: ['admin', 'member', 'viewer'],
  })
  @IsOptional()
  @IsString()
  role?: 'admin' | 'member' | 'viewer';
}

/**
 * DTOs for adding participants
 */
export class AddParticipantDto {
  @ApiProperty({
    description: 'Type of participant',
    enum: ParticipantType,
    example: ParticipantType.CUSTOMER,
    enumName: 'ParticipantType',
  })
  @IsEnum(ParticipantType)
  participantType: ParticipantType;

  @ApiPropertyOptional({
    description: 'Customer ID (required if participant type is customer)',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsOptional()
  @IsUUID(4, { message: 'Customer ID must be a valid UUID' })
  customerId?: string;

  @ApiPropertyOptional({
    description: 'User ID (required if participant type is user)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID(4, { message: 'User ID must be a valid UUID' })
  userId?: string;

  @ApiPropertyOptional({
    description: 'Role of the participant in the conversation',
    default: 'member',
    example: 'admin',
    enum: ['admin', 'member', 'viewer'],
  })
  @IsOptional()
  @IsString()
  role?: 'admin' | 'member' | 'viewer';

  @ApiPropertyOptional({
    description: 'Enable notifications for this participant',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Custom nickname for this member',
    example: 'Support Team Lead',
  })
  @IsOptional()
  @IsString()
  nickname?: string;
}

export class AddMultipleParticipantsDto {
  @ApiProperty({
    description: 'Array of participants to add to the conversation',
    type: [AddParticipantDto],
    example: [
      {
        participantType: 'customer',
        customerId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'member',
        notificationsEnabled: true,
      },
      {
        participantType: 'user',
        userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        role: 'admin',
        notificationsEnabled: true,
        nickname: 'Team Lead',
      },
    ],
  })
  participants: AddParticipantDto[];
}

/**
 * DTOs for updating members
 */
export class UpdateMemberSettingsDto {
  @ApiPropertyOptional({
    description: 'New role for the participant',
    example: 'admin',
    enum: ['admin', 'member', 'viewer'],
  })
  @IsOptional()
  @IsString()
  role?: 'admin' | 'member' | 'viewer';

  @ApiPropertyOptional({
    description: 'Enable/disable notifications',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  notifications_enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Custom nickname for this member',
    example: 'VIP Customer',
  })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({
    description: 'Any additional custom settings',
    example: { preferredLanguage: 'en', theme: 'dark' },
    type: Object,
  })
  @IsOptional()
  @IsObject()
  additionalSettings?: Record<string, any>;
}

/**
 * DTOs for removing participants
 */
export class RemoveParticipantDto {
  @ApiProperty({
    description: 'Type of participant to remove',
    enum: ParticipantType,
    example: ParticipantType.CUSTOMER,
  })
  @IsEnum(ParticipantType)
  participantType: ParticipantType;

  @ApiPropertyOptional({
    description: 'Customer ID (required if participant type is customer)',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsOptional()
  @IsUUID(4)
  customerId?: string;

  @ApiPropertyOptional({
    description: 'User ID (required if participant type is user)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID(4)
  userId?: string;
}

export class BulkRemoveParticipantsDto {
  @ApiProperty({
    description: 'Array of member IDs to remove',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsNumber({}, { each: true })
  memberIds: number[];
}

/**
 * DTOs for member status
 */
export class UpdateLastMessageDto {
  @ApiProperty({
    description: 'ID of the last message seen by this member',
    example: 123,
  })
  @IsNumber()
  messageId: number;
}

/**
 * Response DTOs
 */
export class MemberDetailsDto {
  @ApiProperty({ description: 'Member ID', example: 42 })
  id: number;

  @ApiProperty({
    description: 'Conversation ID',
    example: 123,
  })
  conversationId: number;

  @ApiProperty({
    description: 'Participant type',
    enum: ParticipantType,
    example: ParticipantType.USER,
  })
  participantType: ParticipantType;

  @ApiPropertyOptional({
    description: 'Customer ID if participant is a customer',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  customerId?: string;

  @ApiPropertyOptional({
    description: 'User ID if participant is a user',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  userId?: string;

  @ApiProperty({
    description: 'When participant joined',
    example: '2023-06-01T12:00:00.000Z',
  })
  joinedAt: Date;

  @ApiPropertyOptional({
    description: 'When participant left (if they left)',
    example: '2023-06-30T18:30:00.000Z',
  })
  leftAt?: Date;

  @ApiProperty({
    description: 'Member settings',
    example: {
      role: 'admin',
      notifications_enabled: true,
      nickname: 'Team Lead',
    },
  })
  memberSettings: {
    role: string;
    notifications_enabled: boolean;
    nickname?: string;
    [key: string]: any;
  };

  @ApiPropertyOptional({
    description: 'Last message seen by this member',
    example: {
      id: 456,
      content: 'Hello world',
      createdAt: '2023-06-15T14:30:00.000Z',
    },
  })
  lastMessage?: {
    id: number;
    content: string;
    createdAt: Date;
  };

  @ApiProperty({
    description: 'When record was created',
    example: '2023-06-01T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When record was last updated',
    example: '2023-06-15T14:30:00.000Z',
  })
  updatedAt: Date;
}

export class ParticipantResponseDto {
  @ApiProperty({
    description: 'Participant ID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  id: string;

  @ApiProperty({ description: 'Participant name', example: 'John Doe' })
  name: string;

  @ApiProperty({
    description: 'Participant type',
    enum: ParticipantType,
    example: ParticipantType.USER,
  })
  type: ParticipantType;

  @ApiPropertyOptional({
    description: 'Platform (for customers)',
    example: 'facebook',
  })
  platform?: string;

  @ApiPropertyOptional({
    description: 'Email (for users)',
    example: 'john@example.com',
  })
  email?: string;

  @ApiPropertyOptional({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  avatar?: string;

  @ApiProperty({
    description: 'When participant joined',
    example: '2023-06-01T12:00:00.000Z',
  })
  joinedAt: Date;

  @ApiProperty({
    description: 'Participant role',
    example: 'admin',
    enum: ['admin', 'member', 'viewer'],
  })
  role: string;

  @ApiProperty({
    description: 'Online status',
    example: true,
  })
  isOnline: boolean;

  @ApiPropertyOptional({
    description: 'Custom nickname in this conversation',
    example: 'Sales Manager',
  })
  nickname?: string;
}

export class ConversationMembersResponseDto {
  @ApiProperty({
    description: 'Customer participants',
    type: [ParticipantResponseDto],
  })
  customers: ParticipantResponseDto[];

  @ApiProperty({
    description: 'User participants',
    type: [ParticipantResponseDto],
  })
  users: ParticipantResponseDto[];

  @ApiProperty({
    description: 'Total number of members',
    example: 5,
  })
  totalMembers: number;
}

export class AddParticipantResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Participant added successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Created conversation member',
    type: MemberDetailsDto,
  })
  data: MemberDetailsDto;
}
