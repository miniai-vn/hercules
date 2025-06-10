// chat.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

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

  // Store client ID to user ID mapping for validation
  private clientToUser = new Map<string, string>();

  // Store user ID to client ID mapping (ensure one client per user)
  private userToClient = new Map<string, string>();

  // Store all connected clients
  private connectedClients = new Set<string>();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);

    // Add client to connected clients set
    this.connectedClients.add(client.id);

    // Extract conversationId from query params
    const conversationId = client.handshake.query.conversationId as string;
    const userId = client.handshake.query.userId as string;

    if (userId) {
      // Check if user already has an active connection
      if (this.userToClient.has(userId)) {
        const existingClientId = this.userToClient.get(userId);

        // Disconnect the existing client
        const existingSocket =
          this.server.sockets.sockets.get(existingClientId);
        if (existingSocket) {
          existingSocket.emit('forceDisconnect', {
            reason: 'Another client connected with same user ID',
            timestamp: new Date(),
          });
          existingSocket.disconnect(true);
        }

        // Clean up old mappings
        this.clientToUser.delete(existingClientId);
        this.connectedClients.delete(existingClientId);
      }

      // Set up new mappings
      this.clientToUser.set(client.id, userId);
      this.userToClient.set(userId, client.id);
    }

    if (conversationId) {
      this.joinConversation(client, parseInt(conversationId), userId);
    }

    // Send connection confirmation
    client.emit('connectionConfirmed', {
      clientId: client.id,
      userId: userId,
      timestamp: new Date(),
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    const userId = this.clientToUser.get(client.id);

    // Remove from connected clients
    this.connectedClients.delete(client.id);

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
    if (userId) {
      this.userToClient.delete(userId);
    }
    this.clientToUser.delete(client.id);
  }

  // Validation methods
  isClientConnected(clientId: string): boolean {
    return this.connectedClients.has(clientId);
  }

  isUserConnected(userId: string): boolean {
    return this.userToClient.has(userId);
  }

  getUserClient(userId: string): string | undefined {
    return this.userToClient.get(userId);
  }

  getClientUser(clientId: string): string | undefined {
    return this.clientToUser.get(clientId);
  }

  // Validate client before allowing actions
  private validateClient(client: Socket): boolean {
    return this.connectedClients.has(client.id);
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Get all connected users
  getConnectedUsers(): string[] {
    return Array.from(this.userToClient.keys());
  }

@SubscribeMessage('joinConversation')
  handleJoinConversation(
    @MessageBody() data: { conversationId: number; userId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Validate client exists
    console.log(data);
    if (!this.validateClient(client)) {
      client.emit('error', { message: 'Client not found or invalid' });
      return;
    }

    this.joinConversation(client, data.conversationId, data.userId);
  }

  private joinConversation(
    client: Socket,
    conversationId: number,
    userId?: string,
  ) {
    const roomName = `conversation:${conversationId}`;

    // Create or get conversation data
    if (!this.activeConversations.has(conversationId)) {
      this.activeConversations.set(conversationId, {
        conversationId,
        participants: new Set(),
        userIds: new Set(),
      });
    }

    const conversationData = this.activeConversations.get(conversationId);

    // Join the client to the conversation room
    client.join(roomName);
    conversationData.participants.add(client.id);

    if (userId) {
      conversationData.userIds.add(userId);
    }

    // Store conversation info in client data
    client.data.conversationId = conversationId;
    client.data.userId = userId;

    // Notify the user
    client.emit('joinedConversation', {
      conversationId,
      message: `You joined conversation ${conversationId}`,
    });

    // Notify others in the conversation
    client.to(roomName).emit('userJoinedConversation', {
      message: `User ${userId || client.id} joined conversation`,
      userId: userId || client.id,
      conversationId,
    });
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
    // Validate client exists
    if (!this.validateClient(client)) {
      client.emit('error', { message: 'Client not found or invalid' });
      return;
    }

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

  @SubscribeMessage('validateClient')
  handleClientValidation(@ConnectedSocket() client: Socket) {
    const isValid = this.validateClient(client);
    const userId = this.getClientUser(client.id);

    client.emit('clientValidation', {
      isValid,
      clientId: client.id,
      userId,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('getServerStats')
  handleGetServerStats(@ConnectedSocket() client: Socket) {
    if (!this.validateClient(client)) {
      client.emit('error', { message: 'Client not found or invalid' });
      return;
    }

    client.emit('serverStats', {
      connectedClients: this.getConnectedClientsCount(),
      connectedUsers: this.getConnectedUsers().length,
      activeConversations: this.activeConversations.size,
      timestamp: new Date(),
    });
  }

  // Public method for external validation
  validateClientExists(clientId: string): boolean {
    return this.isClientConnected(clientId);
  }

  // Force disconnect a user (admin function)
  forceDisconnectUser(
    userId: string,
    reason: string = 'Admin action',
  ): boolean {
    const clientId = this.getUserClient(userId);
    if (clientId) {
      const socket = this.server.sockets.sockets.get(clientId);
      if (socket) {
        socket.emit('forceDisconnect', { reason, timestamp: new Date() });
        socket.disconnect(true);
        return true;
      }
    }
    return false;
  }

  // Notify users when someone is typing
  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody()
    data: { conversationId: number; userId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `conversation:${data.conversationId}`;

    client.to(roomName).emit('userTyping', {
      userId: data.userId,
      conversationId: data.conversationId,
      isTyping: data.isTyping,
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
