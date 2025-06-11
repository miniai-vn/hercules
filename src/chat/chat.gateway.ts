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
    number,
    { conversationId: number; participants: Set<string>; userIds: Set<string> }
  >();

  // Store user ID to client ID mapping (ensure one client per user)
  private userToClient = new Map<string, string>();

  constructor(
    private readonly conversationsService: ConversationsService, // Replace with actual service
  ) {}
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    const token = client.handshake.auth.token;
    let userId: string;
    if (token) {
      try {
        // Replace 'your_jwt_secret' with your actual JWT secret
        const decoded: any = jwt.verify(
          token,
          process.env.JWT_SECRET_KEY || 'your_jwt_secret',
        );
        userId = decoded.user_id;
        this.userToClient.set(userId, client.id);
      } catch (err) {
        client.disconnect();
        return;
      }
    } else {
      console.log('No token provided');
      client.emit('forceDisconnect', { reason: 'No token provided' });
      client.disconnect();
      return;
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
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
    @MessageBody() data: { conversationId: number; userId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.joinConversation(client, data.conversationId, data.userId);
  }

  sendEventJoinConversation(conversationId: number, userId: string) {
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
    conversationId: number,
    userId?: string,
  ) {
    const roomName = `conversation:${conversationId}`;
    if (this.activeConversations.has(conversationId)) {
      return;
    }
    // Create or get conversation data
    this.activeConversations.set(conversationId, {
      conversationId,
      participants: new Set(),
      userIds: new Set(),
    });
    client.join(roomName);
    console.log(
      `Client ${client.id} joining conversation ${roomName} with userId ${userId}`,
    );
  }

  @SubscribeMessage('sendMessageToConversation')
  handleMessageToConversation(
    @MessageBody()
    data: {
      conversationId: number;
      message: string;
      userId: string;
      messageType?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `conversation:${data.conversationId}`;
    const conversationData = this.activeConversations.get(data.conversationId);

    if (!conversationData) {
      client.emit('error', { message: 'Conversation not found' });
      return;
    }

    // Verify client is participant in conversation
    if (!conversationData.participants.has(client.id)) {
      client.emit('error', {
        message: 'Client not a participant in this conversation',
      });
      return;
    }

    // Send message to all users in the conversation
    this.server.to(roomName).emit('receiveMessage', {
      message: data.message,
      userId: data.userId,
      conversationId: data.conversationId,
      messageType: data.messageType || 'text',
      timestamp: new Date(),
    });
  }

  // Mark messages as read
  @SubscribeMessage('markAsRead')
  handleMarkAsRead(
    @MessageBody()
    data: { conversationId: number; userId: string; messageId?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `conversation:${data.conversationId}`;

    client.to(roomName).emit('messageRead', {
      userId: data.userId,
      conversationId: data.conversationId,
      messageId: data.messageId,
      timestamp: new Date(),
    });
  }
}
