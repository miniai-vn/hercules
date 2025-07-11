import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { Notification } from './notifications.entity';

@Injectable()
@WebSocketGateway({
  namespace: 'notifications',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Remove client from all user mappings
    for (const [userId, socketIds] of this.userSockets.entries()) {
      socketIds.delete(client.id);
      if (socketIds.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  @SubscribeMessage('join-user-room')
  handleJoinUserRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const { userId } = data;
    
    if (!userId) {
      client.emit('error', { message: 'User ID is required' });
      return;
    }

    // Add client to user's socket set
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);

    // Join the user's personal room
    client.join(`user:${userId}`);
    
    this.logger.log(`Client ${client.id} joined room for user ${userId}`);
    client.emit('joined-user-room', { userId });
  }

  @SubscribeMessage('leave-user-room')
  handleLeaveUserRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const { userId } = data;
    
    if (!userId) {
      client.emit('error', { message: 'User ID is required' });
      return;
    }

    // Remove client from user's socket set
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      userSockets.delete(client.id);
      if (userSockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    // Leave the user's personal room
    client.leave(`user:${userId}`);
    
    this.logger.log(`Client ${client.id} left room for user ${userId}`);
    client.emit('left-user-room', { userId });
  }

  @SubscribeMessage('mark-notification-read')
  handleMarkNotificationRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string; userId: string },
  ) {
    const { notificationId, userId } = data;
    
    // Broadcast to all user's connected clients
    this.server.to(`user:${userId}`).emit('notification-marked-read', {
      notificationId,
      readAt: new Date(),
    });
  }

  // Method to send notification to a specific user
  async sendNotificationToUser(userId: string, notification: Notification) {
    const room = `user:${userId}`;
    
    this.logger.log(`Sending notification ${notification.id} to user ${userId}`);
    
    this.server.to(room).emit('new-notification', {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      data: notification.data,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    });
  }

  // Method to send notification to multiple users
  async sendNotificationToUsers(userIds: string[], notification: Partial<Notification>) {
    const promises = userIds.map(userId => this.sendNotificationToUser(userId, notification as Notification));
    await Promise.all(promises);
  }

  // Method to broadcast system notification to all connected users
  async broadcastSystemNotification(notification: Partial<Notification>) {
    this.logger.log(`Broadcasting system notification: ${notification.title}`);
    
    this.server.emit('system-notification', {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      data: notification.data,
      createdAt: notification.createdAt,
    });
  }

  // Method to get connected users count
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  // Method to check if user is online
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  // Method to get online users
  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  // Method to send unread count update
  async sendUnreadCountUpdate(userId: string, unreadCount: number) {
    const room = `user:${userId}`;
    
    this.server.to(room).emit('unread-count-updated', {
      userId,
      unreadCount,
      timestamp: new Date(),
    });
  }
}
