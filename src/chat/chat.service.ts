import { Injectable } from '@nestjs/common';
import { ChannelsService } from 'src/channels/channels.service';
import { ChannelType } from 'src/channels/dto/channel.dto';
import { ConversationsService } from '../conversations/conversations.service';
import { ChatGateway } from './chat.gateway';
import { ZaloWebhookDto } from './dto/chat-zalo.dto';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { ChatPlatformDto } from './dto/chat-platform.dto';
import { ZaloService } from 'src/integration/zalo/zalo.service';
import { CustomersService } from 'src/customers/customers.service';

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
    private readonly zaloServce: ZaloService,
    private readonly customerService: CustomersService,
  ) {}
  async sendMessagesZaloToPlatform(@Payload() data: ZaloWebhookDto) {
    const { message, sender, recipient } = data;
    const zaloChannel = await this.channelService.getByTypeAndAppId(
      ChannelType.ZALO,
      recipient.id,
    );

    const customer = await this.customerService.findOrCreateByExternalId({
      externalId: sender.id,
      shopId: zaloChannel.shop.id,
      platform: ChannelType.ZALO,
      channelId: zaloChannel.id,
    });

    let userInfo = null;
    if (!customer.name || !customer.avatar) {
      userInfo = await this.zaloServce.getUserProfile({
        userId: sender.id,
        accessToken: zaloChannel.accessToken,
      });

      await this.customerService.update(customer.id, {
        name: userInfo.data.data.display_name,
        avatar: userInfo.data.data.avatar,
        phone: userInfo.data.data.shared_info?.phone || '',
      });
    }

    const { conversation, messageData, isNewConversation } =
      await this.conversationsService.sendZaloMessageToConversation({
        message: message.text,
        channel: zaloChannel,
        customerId: customer.id,
        avatar: customer.avatar ?? userInfo?.data.data.avatar,
        name: customer.name ?? userInfo?.data.data.display_name,
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

  async sendMessagePlatformToZalo(data: ChatPlatformDto): Promise<void> {}
}
