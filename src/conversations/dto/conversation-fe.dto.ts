import { ApiProperty } from '@nestjs/swagger';

export interface UserDto {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  platform?: string;
}

export interface MessageDto {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
}

export interface ConversationFEDto {
  id: string;
  participants: UserDto[];
  lastMessage: MessageDto | null;
  unreadCount: number;
  isGroup: boolean;
  name?: string;
  channel?: string;
}

export class ConversationListFEResponseDto {
  @ApiProperty({
    description: 'List of conversations in frontend format',
    type: 'array',
  })
  conversations: ConversationFEDto[];

  @ApiProperty({
    description: 'Total number of conversations',
    example: 4,
  })
  total: number;
}
