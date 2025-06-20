import { Injectable } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { ChannelsService } from 'src/channels/channels.service';
import { ChannelType } from 'src/channels/dto/channel.dto';
import { ConversationsService } from '../conversations/conversations.service';
import { ChatGateway } from './chat.gateway';
import { ZaloWebhookDto } from './dto/chat-zalo.dto';
import { ParticipantType } from 'src/conversation-members/conversation-members.entity';
import { ZaloService } from 'src/integration/zalo/zalo.service';

export interface SendMessageData {
  conversationId: number;
  message: string;
  userId: string;
  messageType?: string;
  shopId: string;
}

export interface TypingData {
  conversationId: number;
  userId: string;
  isTyping: boolean;
  shopId: string;
}

export interface MarkAsReadData {
  conversationId: number;
  userId: string;
  messageId?: number;
  shopId: string;
}

export interface JoinConversationData {
  conversationId: number;
  userId: string;
  shopId: string;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly chatGateway: ChatGateway,
    private readonly conversationsService: ConversationsService,
    private readonly channelService: ChannelsService,
    private readonly zaloService: ZaloService, // Assuming zaloService is used for Zalo-specific operations
  ) {}
  async sendMessagesZaloToPlatform(@Payload() data: ZaloWebhookDto) {
    const { message, recipient, sender } = data;
    const zaloChannel = await this.channelService.getByTypeAndAppId(
      ChannelType.ZALO,
      recipient.id,
    );

    const { conversation, messageData, isNewConversation } =
      await this.conversationsService.sendMessageToConversation({
        message: message.text,
        channel: zaloChannel,
        customerId: sender.id,
      });

    if (isNewConversation) {
      conversation.members.forEach((member) => {
        this.chatGateway.sendEventJoinConversation(
          conversation.id,
          member.userId,
        );
      });
    }

    const roomName = `conversation:${conversation.id}`;
    this.chatGateway.server.to(roomName).emit('receiveMessage', {
      ...messageData,
      conversationId: conversation.id,
      channelType: ChannelType.ZALO,
    });
  }

  async sendMessagePlatformToZalo(data: SendMessageData): Promise<void> {
    try {
      const roomName = `conversation:${data.conversationId}`;
      const { accessToken, customerId, channelType, message } =
        await this.conversationsService.sendMessageToOtherPlatform({
          conversationId: data.conversationId,
          message: data.message,
          userId: data.userId,
          messageType: data.messageType,
        });
      if (channelType === ChannelType.ZALO) {
        await this.zaloService.sendMessage(
          accessToken,
          data.message,
          customerId,
        );
      }

      this.chatGateway.server.to(roomName).emit('receiveMessage', {
        ...message,
        conversationId: data.conversationId,
        channelType: ChannelType.ZALO,
      });
    } catch (error) {
      throw new Error(`Failed to send message other platform`);
    }
  }
}
