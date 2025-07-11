import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationQueryDto,
  NotificationResponseDto,
  BulkUpdateNotificationDto,
  NotificationStatsDto,
  SendNotificationDto,
} from './dto/notification.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully',
    type: NotificationResponseDto,
  })
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Post('send')
  @ApiOperation({
    summary: 'Create and send notification (with real-time support)',
  })
  @ApiResponse({
    status: 201,
    description: 'Notification created and sent successfully',
    type: NotificationResponseDto,
  })
  async createAndSend(@Body() sendNotificationDto: SendNotificationDto) {
    return this.notificationsService.createAndSend(sendNotificationDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all notifications with filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    type: [NotificationResponseDto],
  })
  async findAll(@Query() query: NotificationQueryDto) {
    return this.notificationsService.findAll(query);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get notifications for a specific user' })
  @ApiResponse({
    status: 200,
    description: 'User notifications retrieved successfully',
    type: [NotificationResponseDto],
  })
  async findByUserId(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: Omit<NotificationQueryDto, 'userId'>,
  ) {
    return this.notificationsService.findByUserId(userId, query);
  }

  @Get('user/:userId/stats')
  @ApiOperation({ summary: 'Get notification statistics for a user' })
  @ApiResponse({
    status: 200,
    description: 'Notification statistics retrieved successfully',
    type: NotificationStatsDto,
  })
  async getStats(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.notificationsService.getStats(userId);
  }

  @Get('user/:userId/unread-count')
  @ApiOperation({ summary: 'Get unread notifications count for a user' })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
  })
  async getUnreadCount(@Param('userId', ParseUUIDPipe) userId: string) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { userId, unreadCount: count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a notification by ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully',
    type: NotificationResponseDto,
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification updated successfully',
    type: NotificationResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
    type: NotificationResponseDto,
  })
  async markAsRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch(':id/unread')
  @ApiOperation({ summary: 'Mark notification as unread' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as unread',
    type: NotificationResponseDto,
  })
  async markAsUnread(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.markAsUnread(id);
  }

  @Patch('user/:userId/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for a user' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
  })
  async markAllAsRead(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch('bulk-update')
  @ApiOperation({ summary: 'Bulk update notifications' })
  @ApiResponse({
    status: 200,
    description: 'Notifications updated successfully',
  })
  async bulkUpdate(@Body() bulkUpdateDto: BulkUpdateNotificationDto) {
    return this.notificationsService.bulkUpdate(bulkUpdateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.notificationsService.remove(id);
    return { message: 'Notification deleted successfully' };
  }

  @Delete('user/:userId')
  @ApiOperation({ summary: 'Delete all notifications for a user' })
  @ApiResponse({
    status: 200,
    description: 'User notifications deleted successfully',
  })
  async removeByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.notificationsService.removeByUserId(userId);
  }

  // Special endpoints for different notification types
  @Post('order')
  @ApiOperation({ summary: 'Create order notification' })
  @ApiResponse({
    status: 201,
    description: 'Order notification created successfully',
    type: NotificationResponseDto,
  })
  async createOrderNotification(
    @Body()
    data: {
      userId: string;
      orderId: string;
      title: string;
      body: string;
      additionalData?: any;
    },
  ) {
    const { userId, orderId, title, body, additionalData } = data;
    return this.notificationsService.createOrderNotification(
      userId,
      orderId,
      title,
      body,
      additionalData,
    );
  }

  @Post('message')
  @ApiOperation({ summary: 'Create message notification' })
  @ApiResponse({
    status: 201,
    description: 'Message notification created successfully',
    type: NotificationResponseDto,
  })
  async createMessageNotification(
    @Body()
    data: {
      userId: string;
      messageId: string;
      conversationId: string;
      senderName: string;
      messageContent: string;
    },
  ) {
    const { userId, messageId, conversationId, senderName, messageContent } =
      data;
    return this.notificationsService.createMessageNotification(
      userId,
      messageId,
      conversationId,
      senderName,
      messageContent,
    );
  }

  @Post('system')
  @ApiOperation({ summary: 'Create system notification' })
  @ApiResponse({
    status: 201,
    description: 'System notification created successfully',
    type: NotificationResponseDto,
  })
  async createSystemNotification(
    @Body()
    data: {
      userId: string;
      title: string;
      body: string;
      additionalData?: any;
    },
  ) {
    const { userId, title, body, additionalData } = data;
    return this.notificationsService.createSystemNotification(
      userId,
      title,
      body,
      additionalData,
    );
  }
}
