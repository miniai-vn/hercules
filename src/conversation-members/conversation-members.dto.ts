import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ParticipantType } from './conversation-members.entity';

export class AddParticipantDto {
  @ApiProperty({
    description: 'Type of participant',
    enum: ParticipantType,
    example: ParticipantType.CUSTOMER,
    enumName: 'ParticipantType',
  })
  @IsEnum(ParticipantType)
  participantType: ParticipantType;

  @ApiProperty({
    description: 'Customer ID (required if participant type is customer)',
    required: false,
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsOptional()
  @IsUUID(4, { message: 'Customer ID must be a valid UUID' })
  customerId?: string;

  @ApiProperty({
    description: 'User ID (required if participant type is user)',
    required: false,
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID(4, { message: 'User ID must be a valid UUID' })
  userId?: string;

  @ApiProperty({
    description: 'Role of the participant in the conversation',
    required: false,
    default: 'member',
    example: 'admin',
    enum: ['admin', 'moderator', 'member', 'observer'],
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({
    description: 'Enable notifications for this participant',
    required: false,
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;
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
      },
    ],
  })
  participants: AddParticipantDto[];
}

export class RemoveParticipantDto {
  @ApiProperty({
    description: 'Type of participant to remove',
    enum: ParticipantType,
    example: ParticipantType.CUSTOMER,
  })
  @IsEnum(ParticipantType)
  participantType: ParticipantType;

  @ApiProperty({
    description: 'Customer ID (required if participant type is customer)',
    required: false,
  })
  @IsOptional()
  @IsUUID(4)
  customerId?: string;

  @ApiProperty({
    description: 'User ID (required if participant type is user)',
    required: false,
  })
  @IsOptional()
  @IsUUID(4)
  userId?: string;
}

export class UpdateParticipantRoleDto {
  @ApiProperty({
    description: 'New role for the participant',
    example: 'moderator',
    enum: ['admin', 'moderator', 'member', 'observer'],
  })
  @IsString()
  role: string;

  @ApiProperty({
    description: 'Enable/disable notifications',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;
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

// Response DTOs
export class ParticipantResponseDto {
  @ApiProperty({ description: 'Participant ID' })
  id: string;

  @ApiProperty({ description: 'Participant name' })
  name: string;

  @ApiProperty({ description: 'Participant type', enum: ParticipantType })
  type: ParticipantType;

  @ApiProperty({ description: 'Platform (for customers)', required: false })
  platform?: string;

  @ApiProperty({ description: 'Email (for users)', required: false })
  email?: string;

  @ApiProperty({ description: 'Avatar URL' })
  avatar: string;

  @ApiProperty({ description: 'When participant joined' })
  joinedAt: Date;

  @ApiProperty({ description: 'Participant role' })
  role: string;

  @ApiProperty({ description: 'Online status' })
  isOnline: boolean;
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

  @ApiProperty({ description: 'Total number of members' })
  totalMembers: number;
}

export class AddParticipantResponseDto {
  @ApiProperty({ description: 'Success message' })
  message: string;

  @ApiProperty({ description: 'Created conversation member' })
  data: {
    id: number;
    conversationId: number;
    participantType: ParticipantType;
    customerId?: string;
    userId?: string;
    joinedAt: Date;
    role: string;
  };
}
