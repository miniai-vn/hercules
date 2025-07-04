import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ChannelsService } from 'src/channels/channels.service';
import { ChannelType } from 'src/channels/dto/channel.dto';
import { CustomersService } from 'src/customers/customers.service';
import { ZaloService } from 'src/integration/zalo/zalo.service';
import { ConversationsService } from '../conversations/conversations.service';
import { ChatGateway } from './chat.gateway';
import { ZaloWebhookDto } from './dto/chat-zalo.dto';
import { ParticipantType } from 'src/conversation-members/conversation-members.entity';
import { FacebookEventDTO } from 'src/integration/facebook/dto/facebook-webhook.dto';
import { FacebookService } from 'src/integration/facebook/facebook.service';
import { Platform } from 'src/customers/customers.dto';
import { ConversationType } from 'src/conversations/conversations.entity';
import { Conversation } from 'src/conversations/conversations.entity';
import { AgentServiceService } from 'src/integration/agent-service/agent-service.service';
import { AgentsService } from 'src/agents/agents.service';
import { MessageType } from 'src/common/enums/message.enum';
import { MessagesService } from 'src/messages/messages.service';

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
    private readonly messagesService: MessagesService, // Assuming messagesService is similar to conversationsService
    private readonly agentService: AgentsService, // Assuming agentService is similar to customerService
    private readonly agentServiceService: AgentServiceService, // Assuming agentServiceService is similar to customerService
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
        sender: {
          avatar: customer.avatar,
          name: customer.name,
        },
        conversationId: conversation.id,
        channelType: ChannelType.ZALO,
      });
      if (conversation.isBot) {
        this.botSendMessage(conversation, message.text);
      }
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to send message from Zalo to platform: ${error.message}`,
      );
    }
  }

  async sendMessagePlatformToOmniChannel(data: SendMessageData) {
    try {
      const roomName = `conversation:${data.conversationId}`;
      const conversation = await this.conversationsService.findOne(
        data.conversationId,
      );
      if (conversation.isBot) {
        return {
          message: 'Cannot send message to bot conversation',
          status: 'BOT_IS_ACTIVE',
        };
      }
      const customer = conversation.members.find(
        (member) => !!member.customerId,
      ).customer;

      const channel = conversation.channel;

      if (channel.type === ChannelType.ZALO) {
        const res = await this.zaloService.sendMessage(
          channel.accessToken,
          data.content,
          customer.externalId,
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

  async sendMessagesFacebookToPlatform(data: FacebookEventDTO) {
    try {
      const { message, recipient, sender } = data;
      const channel = await this.channelService.getByTypeAndAppId(
        ChannelType.FACEBOOK,
        recipient.id,
      );

      if (!channel) return { message: 'Channel not found or not active' };

      let customer = await this.customerService.findByExternalId(
        Platform.FACEBOOK,
        sender.id,
      );

      if (!customer) {
        const query = {
          access_token: channel.accessToken,
          fields: 'first_name,last_name,profile_pic,name',
          psid: sender.id,
        };

        const resp = await this.facebookService.getUserProfile(query);

        customer = await this.customerService.findOrCreateByExternalId({
          platform: Platform.FACEBOOK,
          externalId: sender.id,
          avatar: resp.profile_pic,
          name: resp.name,
          channelId: channel.id,
          shopId: channel.shop.id,
        });
      }

      const { conversation, messageData, isNewConversation } =
        await this.conversationsService.sendMessageToConversation({
          channel: channel,
          externalMessageId: message.mid,
          message: message.text,
          type: 'text',
          customer,
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

  // async handleMessageReadFacebook(data: FacebookEventDTO): Promise<void> {
  //   const { sender, recipient, read } = data;

  //   const senderId = sender.id;
  //   const recipientId = recipient.id;
  //   const watermark = read?.watermark;

  //   if (!senderId || !recipientId || !watermark) {
  //     throw new InternalServerErrorException(
  //       'Invalid data received from Facebook read event',
  //     );
  //   }

  //   const channel = await this.channelService.getByTypeAndAppId(
  //     ChannelType.FACEBOOK,
  //     recipientId,
  //   );

  //   const conversation =
  //     await this.conversationsService.findOneByExternalIdAndChannelId(
  //       senderId,
  //       channel.id,
  //     );

  //   console.log('[DEBUG] Conversation:', conversation);

  //   const result = await this.messagesService.markMessagesAsReadForPlatform({
  //     platform: Platform.FACEBOOK,
  //     conversationId: conversation.id,
  //     userExternalId: senderId,
  //     readToTime: new Date(watermark),
  //   });

  //   console.log(
  //     `[DEBUG] Mark messages as read for conversationId=${conversation.id}:`,
  //     result,
  //   );
  // }

  async botSendMessage(conversation: Conversation, message: string) {
    const agents = await this.agentService.findByChannelId(
      conversation.channel.id,
    );
    const customer = conversation.members.find(
      (member) => !!member.customerId,
    ).customer;
    const history = conversation.messages.slice(-10);
    for (const agent of agents) {
      const prompt = agent.prompt;
      const aiResponse = await this.agentServiceService.askQuestion({
        prompt,
        history,
        question: message,
        modelName: agent.modelName,
      });
      if (!aiResponse) {
        return;
      }

      const zaloMsg = await this.zaloService.sendMessage(
        conversation.channel.accessToken,
        aiResponse.data.data.answer,
        customer.externalId,
      );

      const { message: dataMessage } =
        await this.conversationsService.sendAgentMessageToConversation({
          agentId: agent.id,
          channel: conversation.channel,
          customer: customer,
          message: {
            content: aiResponse.data.data.answer,
            externalMessageId: zaloMsg.data.message_id,
            type: MessageType.TEXT,
          },
        });

      const roomName = `conversation:${conversation.id}`;
      this.chatGateway.server.to(roomName).emit('receiveMessage', {
        ...dataMessage,
        senderId: agent.id,
        conversationId: conversation.id,
        channelType: ChannelType.ZALO,
      });
    }
  }
}
