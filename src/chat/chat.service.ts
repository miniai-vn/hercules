import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { ChannelsService } from 'src/channels/channels.service';
import { ChannelType } from 'src/channels/dto/channel.dto';
import { CustomersService } from 'src/customers/customers.service';
import { ZaloService } from 'src/integration/zalo/zalo.service';
import { UsersService } from 'src/users/users.service';
import { ConversationsService } from '../conversations/conversations.service';
import { ChatGateway } from './chat.gateway';
import { ZaloWebhookDto } from './dto/chat-zalo.dto';
import { ParticipantType } from 'src/conversation-members/conversation-members.entity';
import { FacebookMessagingEventDTO } from 'src/integration/facebook/dto/facebook-webhook.dto';
import { FacebookService } from 'src/integration/facebook/facebook.service';
import { Platform } from 'src/customers/customers.dto';
import { ConversationType } from 'src/conversations/conversations.entity';

export interface SendMessageData {
  conversationId: number;
  content: string;
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
    private readonly zaloService: ZaloService,
    private readonly customerService: CustomersService,
    private readonly facebookService: FacebookService,
  ) {}
  async sendMessagesZaloToPlatform(data: ZaloWebhookDto) {
    try {
      const { message, recipient, sender } = data;
      const zaloChannel = await this.channelService.getByTypeAndAppId(
        ChannelType.ZALO,
        recipient.id,
      );

      if (!zaloChannel) {
        return { message: 'Channel not found or not active' };
      }

      let customer = await this.customerService.findByExternalId(
        ChannelType.ZALO,
        sender.id,
      );

      if (!customer) {
        const metadataCustomerZalo = await this.zaloService.getUserProfile(
          zaloChannel.accessToken,
          sender.id,
        );

        customer = await this.customerService.findOrCreateByExternalId({
          platform: ChannelType.ZALO,
          externalId: sender.id,
          avatar: metadataCustomerZalo.data.data.avatar,
          name: metadataCustomerZalo.data.data.display_name,
          channelId: zaloChannel.id,
        });
      }

      const { conversation, messageData, isNewConversation } =
        await this.conversationsService.sendMessageToConversation({
          externalMessageId: message.msg_id,
          message: message.text,
          channel: zaloChannel,
          customer,
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
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to send message from Zalo to platform: ${error.message}`,
      );
    }
  }

  async sendMessagePlatformToOmniChannel(data: SendMessageData): Promise<void> {
    try {
      const roomName = `conversation:${data.conversationId}`;
      const conversation = await this.conversationsService.findOne(
        data.conversationId,
      );
      const customer = conversation.members.find(
        (member) => !!member.customerId,
      );

      const customerDetails = await this.customerService.findOne(
        customer.customerId,
      );

      const channel = conversation.channel;

      if (channel.type === ChannelType.ZALO) {
        const res = await this.zaloService.sendMessage(
          channel.accessToken,
          data.content,
          customerDetails.externalId,
        );

        const { message } =
          await this.conversationsService.sendMessageToOtherPlatform({
            conversationId: data.conversationId,
            message: {
              content: data.content,
              externalMessageId: res.data.message_id,
            },
            userId: data.userId,
            messageType: data.messageType,
          });

        this.chatGateway.server.to(roomName).emit('receiveMessage', {
          ...message,
          senderId: data.userId,
          conversationId: data.conversationId,
          channelType: ChannelType.ZALO,
        });
      }
      if (channel.type === ChannelType.FACEBOOK) {
        const resp = await this.facebookService.sendMessageFacebook(
          channel.accessToken,
          conversation.externalId,
          data.content,
        );

        const { message } =
          await this.conversationsService.sendMessageToOtherPlatform({
            conversationId: data.conversationId,
            message: {
              content: data.content,
              externalMessageId: resp.data.message_id,
            },
            userId: data.userId,
            messageType: data.messageType,
          });

        this.chatGateway.server.to(roomName).emit('receiveMessage', {
          ...message,
          conversationId: data.conversationId,
          channelType: ChannelType.FACEBOOK,
        });
      }
    } catch (error) {
      throw new Error(`Failed to send message other platform`);
    }
  }

  async sendMessagesFacebookToPlatform(data: FacebookMessagingEventDTO) {
    try {
      const { message, recipient, sender } = data;

      const channel = await this.channelService.getByTypeAndAppId(
        ChannelType.FACEBOOK,
        recipient.id,
      );

      if (!channel) return;

      const customerInfo = await this.customerService.findByExternalId(
        Platform.FACEBOOK,
        sender.id,
      );

      if (customerInfo && customerInfo.avatar && customerInfo.name) return;

      const query = {
        access_token: channel.accessToken,
        fields: 'first_name,last_name,profile_pic,name',
        psid: sender.id,
        pageId: channel.appId,
      };

      const resp = await this.facebookService.getUserProfile(query);

      const customer = await this.customerService.findOrCreateByExternalId({
        platform: ChannelType.FACEBOOK,
        externalId: sender.id,
        avatar: resp.profile_pic,
        name: resp.name,
        channelId: channel.id,
        shopId: channel.shop.id,
      });

      const { conversation, messageData, isNewConversation } =
        await this.conversationsService.sendMessageToConversation({
          channel: channel,
          customer: customer,
          externalMessageId: message.mid,
          message: message.text,
          type: 'text',
        });

      if (isNewConversation) {
        conversation.members
          .filter((member) => !!member.userId)
          .forEach((member) => {
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
        channelType: ChannelType.FACEBOOK,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to send message from Facebook to platform: ${error.message}`,
      );
    }
  }
}
