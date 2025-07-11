import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUUID,
  IsObject,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from '../notifications.entity';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'User ID to receive the notification',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Notification title',
    example: 'New message received',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Notification body/content',
    example: 'You have received a new message from John Doe',
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({
    description: 'Notification type',
    enum: NotificationType,
    example: NotificationType.MESSAGE,
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({
    description: 'Additional data for the notification',
    example: { orderId: '123', messageId: '456', link: '/orders/123' },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

export class UpdateNotificationDto {
  @ApiPropertyOptional({
    description: 'Whether the notification is read',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({
    description: 'When the notification was read',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  readAt?: Date;
}

export class NotificationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by notification type',
    enum: NotificationType,
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({
    description: 'Filter by read status',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isRead?: boolean;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiPropertyOptional()
  data?: Record<string, any>;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  readAt?: Date;
}

export class BulkUpdateNotificationDto {
  @ApiProperty({
    description: 'Array of notification IDs to update',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsUUID(4, { each: true })
  @IsNotEmpty()
  notificationIds: string[];

  @ApiPropertyOptional({
    description: 'Mark as read/unread',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}

export class NotificationStatsDto {
  @ApiProperty()
  totalNotifications: number;

  @ApiProperty()
  unreadCount: number;

  @ApiProperty()
  readCount: number;

  @ApiProperty()
  notificationsByType: Record<NotificationType, number>;
}

export class SendNotificationDto extends CreateNotificationDto {
  @ApiPropertyOptional({
    description: 'Send real-time notification via WebSocket',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  sendRealTime?: boolean = true;
}
