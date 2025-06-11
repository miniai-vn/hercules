import { Injectable } from '@nestjs/common';
import { ChannelsService } from 'src/channels/channels.service';
import { ChannelType } from 'src/channels/dto/channel.dto';
import { ConversationsService } from '../conversations/conversations.service';
import { MessagesService } from '../messages/messages.service';
import { ChatGateway } from './chat.gateway';
import { ZaloWebhookDto } from './dto/chat-zalo.dto';

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
    private readonly channelService: ChannelsService, // Assuming you have a ChannelService to handle channel-related logic
  ) {}

  async sendMessages(data: ZaloWebhookDto) {
    const { message, app_id, sender } = data;
    const zaloChannel = await this.channelService.getByTypeAndAppId(
      ChannelType.ZALO,
      app_id,
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
}
