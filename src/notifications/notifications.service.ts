import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, In } from 'typeorm';
import { Notification, NotificationType } from './notifications.entity';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationQueryDto,
  BulkUpdateNotificationDto,
  NotificationStatsDto,
  SendNotificationDto,
} from './dto/notification.dto';
import { NotificationGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(createNotificationDto);
    return await this.notificationRepository.save(notification);
  }

  async createAndSend(sendNotificationDto: SendNotificationDto): Promise<Notification> {
    const { sendRealTime = true, ...createDto } = sendNotificationDto;
    
    const notification = await this.create(createDto);

    // Send real-time notification if enabled
    if (sendRealTime) {
      await this.notificationGateway.sendNotificationToUser(
        notification.userId,
        notification,
      );
    }

    return notification;
  }

  async findAll(query: NotificationQueryDto) {
    const { page = 1, limit = 20, userId, type, isRead } = query;
    
    const whereConditions: any = {};
    
    if (userId) {
      whereConditions.userId = userId;
    }
    
    if (type) {
      whereConditions.type = type;
    }
    
    if (isRead !== undefined) {
      whereConditions.isRead = isRead;
    }

    const findOptions: FindManyOptions<Notification> = {
      where: whereConditions,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
      relations: [], // ['user'] - uncomment when User entity is available
    };

    const [notifications, total] = await this.notificationRepository.findAndCount(findOptions);

    return {
      data: notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: [], // ['user'] - uncomment when User entity is available
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async findByUserId(userId: string, query: Omit<NotificationQueryDto, 'userId'> = {}) {
    return this.findAll({ ...query, userId });
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
    const notification = await this.findOne(id);

    // If marking as read, set readAt timestamp
    if (updateNotificationDto.isRead === true && !notification.isRead) {
      updateNotificationDto.readAt = new Date();
    }
    
    // If marking as unread, clear readAt timestamp
    if (updateNotificationDto.isRead === false) {
      updateNotificationDto.readAt = null;
    }

    Object.assign(notification, updateNotificationDto);
    return await this.notificationRepository.save(notification);
  }

  async markAsRead(id: string): Promise<Notification> {
    return this.update(id, { isRead: true, readAt: new Date() });
  }

  async markAsUnread(id: string): Promise<Notification> {
    return this.update(id, { isRead: false, readAt: null });
  }

  async markAllAsRead(userId: string): Promise<{ affected: number }> {
    const result = await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    return { affected: result.affected || 0 };
  }

  async bulkUpdate(bulkUpdateDto: BulkUpdateNotificationDto): Promise<{ affected: number }> {
    const { notificationIds, isRead } = bulkUpdateDto;

    if (notificationIds.length === 0) {
      throw new BadRequestException('At least one notification ID is required');
    }

    const updateData: any = {};
    
    if (isRead !== undefined) {
      updateData.isRead = isRead;
      updateData.readAt = isRead ? new Date() : null;
    }

    const result = await this.notificationRepository.update(
      { id: In(notificationIds) },
      updateData,
    );

    return { affected: result.affected || 0 };
  }

  async remove(id: string): Promise<void> {
    const notification = await this.findOne(id);
    await this.notificationRepository.remove(notification);
  }

  async removeByUserId(userId: string): Promise<{ affected: number }> {
    const result = await this.notificationRepository.delete({ userId });
    return { affected: result.affected || 0 };
  }

  async getStats(userId: string): Promise<NotificationStatsDto> {
    const [
      totalNotifications,
      unreadCount,
      notificationsByType,
    ] = await Promise.all([
      this.notificationRepository.count({ where: { userId } }),
      this.notificationRepository.count({ where: { userId, isRead: false } }),
      this.getNotificationsByType(userId),
    ]);

    return {
      totalNotifications,
      unreadCount,
      readCount: totalNotifications - unreadCount,
      notificationsByType,
    };
  }

  private async getNotificationsByType(userId: string): Promise<Record<NotificationType, number>> {
    const result = await this.notificationRepository
      .createQueryBuilder('notification')
      .select('notification.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('notification.userId = :userId', { userId })
      .groupBy('notification.type')
      .getRawMany();

    const notificationsByType = {} as Record<NotificationType, number>;
    
    // Initialize all types with 0
    Object.values(NotificationType).forEach(type => {
      notificationsByType[type] = 0;
    });
    
    // Fill with actual counts
    result.forEach(item => {
      notificationsByType[item.type] = parseInt(item.count);
    });

    return notificationsByType;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  // Helper methods for creating specific notification types
  async createOrderNotification(
    userId: string,
    orderId: string,
    title: string,
    body: string,
    additionalData?: any,
  ): Promise<Notification> {
    return this.createAndSend({
      userId,
      title,
      body,
      type: NotificationType.ORDER,
      data: {
        orderId,
        link: `/orders/${orderId}`,
        ...additionalData,
      },
    });
  }

  async createMessageNotification(
    userId: string,
    messageId: string,
    conversationId: string,
    senderName: string,
    messageContent: string,
  ): Promise<Notification> {
    return this.createAndSend({
      userId,
      title: `New message from ${senderName}`,
      body: messageContent.length > 100 
        ? `${messageContent.substring(0, 100)}...` 
        : messageContent,
      type: NotificationType.MESSAGE,
      data: {
        messageId,
        conversationId,
        senderName,
        link: `/conversations/${conversationId}`,
      },
    });
  }

  async createSystemNotification(
    userId: string,
    title: string,
    body: string,
    additionalData?: any,
  ): Promise<Notification> {
    return this.createAndSend({
      userId,
      title,
      body,
      type: NotificationType.SYSTEM,
      data: additionalData,
    });
  }
}
