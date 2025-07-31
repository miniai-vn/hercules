import * as dotenv from 'dotenv';
dotenv.config();
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import * as jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { ConversationsService } from 'src/conversations/conversations.service';
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Store active conversation rooms
  private activeConversations = new Map<
    string,
    { conversationId: string; participants: Set<string>; userIds: Set<string> }
  >();

  // Store user ID to client ID mapping (ensure one client per user)
  private userToClient = new Map<string, string>();

  eventSet = new Set<string>();

  constructor(private readonly conversationsService: ConversationsService) {}
  handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    let userId: string;
    if (token) {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET_KEY);
        userId = decoded.userId;
        if (this.userToClient.has(userId)) {
          throw new Error('User already connected');
        }
        this.userToClient.set(client.id, userId);
      } catch (err) {
        client.disconnect();
        return;
      }
    } else {
      client.emit('forceDisconnect', { reason: 'No token provided' });
      client.disconnect();
      return;
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.userToClient.get(client.id);
    // Remove user from all conversations they were participating in
    this.activeConversations.forEach((conversation, conversationId) => {
      conversation.participants.delete(client.id);
      if (userId) {
        conversation.userIds.delete(userId);
      }

      if (conversation.participants.size === 0) {
        this.activeConversations.delete(conversationId);
      }
    });

    // Clean up mappings
  }

  @SubscribeMessage('joinAllConversationsWithUserId')
  async handleJoinConversations(
    @MessageBody() data: { userId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const conversations =
      await this.conversationsService.getConversationByUserId(data.userId);
    Promise.all(
      conversations.map((conversation) => {
        this.joinConversation(client, conversation.id, data.userId);
      }),
    );
  }

  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @MessageBody() data: { conversationId: string; userId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.joinConversation(client, data.conversationId, data.userId);
  }

  sendEventJoinConversation(conversationId: string, userId: string) {
    try {
      if (!this.activeConversations.has(conversationId)) {
        this.activeConversations.set(conversationId, {
          conversationId,
          participants: new Set(),
          userIds: new Set(),
        });
        const client = this.userToClient.get(userId);
        this.server.to(client).emit('newConversation', {
          conversationId,
          message: `You joined conversation ${conversationId}`,
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  async joinConversation(
    client: Socket,
    conversationId: string,
    userId?: string,
  ) {
    const roomName = `conversation:${conversationId}`;
    if (this.activeConversations.has(conversationId)) {
      return;
    }
    this.activeConversations.set(conversationId, {
      conversationId,
      participants: new Set(),
      userIds: new Set(),
    });
    client.join(roomName);
  }

  @SubscribeMessage('sendMessageToConversation')
  handleMessageToConversation(
    @MessageBody()
    data: {
      conversationId: number;
      message: string;
      userId: string;
      messageType?: string;
      key?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `conversation:${data.conversationId}`;

    if (this.eventSet.has(data.key)) {
      return;
    }

    this.eventSet.add(data.key);
    this.server.to(roomName).emit('receiveMessage', {
      content: data.message,
      senderId: data.userId,
      key: `${data.conversationId}-${Date.now()}`,
      conversationId: data.conversationId,
      messageType: data.messageType || 'text',
      timestamp: new Date(),
    });
  }

  // Mark messages as read
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody()
    data: { conversationId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const roomName = `conversation:${data.conversationId}`;
      const lastMessage = await this.conversationsService.markReadConversation(
        data.conversationId,
        data.userId,
      );

      client.to(roomName).emit('messageRead', {
        userId: data.userId,
        conversationId: data.conversationId,
        messageId: lastMessage.id,
        readBy: lastMessage.readBy,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      client.emit('error', {
        message: 'Failed to mark messages as read',
        error: error.message,
      });
    }
  }
}
