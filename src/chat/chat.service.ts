import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AgentsService } from 'src/agents/agents.service';
import { ChannelsService } from 'src/channels/channels.service';
import { ChannelType } from 'src/channels/dto/channel.dto';
import { MessageType } from 'src/common/enums/message.enum';
import { Conversation } from 'src/conversations/conversations.entity';
import { Platform } from 'src/customers/customers.dto';
import { CustomersService } from 'src/customers/customers.service';
import { AgentServiceService } from 'src/integration/agent-service/agent-service.service';
import { FacebookEventDTO } from 'src/integration/facebook/dto/facebook-webhook.dto';
import { FacebookService } from 'src/integration/facebook/facebook.service';
import { ZaloService } from 'src/integration/zalo/zalo.service';
import { SenderType } from 'src/messages/messages.dto';
import { ConversationsService } from '../conversations/conversations.service';
import { ChatGateway } from './chat.gateway';
import { ZaloWebhookDto } from './dto/chat-zalo.dto';

export interface SendMessageData {
  conversationId: number;
  content: string;
  userId: string;
  messageType?: string;
  shopId: string;
  isEcho: boolean;
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
    private readonly agentService: AgentsService,
    private readonly agentServiceService: AgentServiceService,
  ) {}

  /**
   * Handles incoming messages from Zalo and sends them to the platform.
   */

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

      const transferMessage = {
        content: message.text,
        links: message.links,
        id: message.msg_id,
        createdAt: new Date(),
        contentType: message.contentType ?? MessageType.TEXT,
        senderType: SenderType.user,
      };


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
        await this.conversationsService.handerUserMessage({
          message: transferMessage,
          channel: zaloChannel,
          customer,
          externalConversation: {
            id: customer.externalId,
            timestamp: new Date(),
          },
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

  /**
   * Sends a message from the platform to an Omni-channel conversation.
   */

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
              externalMessageId: res.data.data.message_id,
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
          customer.externalId,
          data.content,
          channel.appId,
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
      throw new InternalServerErrorException(
        `Failed to send message to other platform: ${error.message}`,
      );
    }
  }

  /**
   * Handle message facebook
   */

  async handleMessageFaceBook(data: FacebookEventDTO) {
    try {
      const { message, recipient, sender, timestamp } = data;
      const channel = await this.channelService.getByTypeAndAppId(
        ChannelType.FACEBOOK,
        recipient.id,
      );

      if (!channel) return { message: 'Channel not found or not active' };

      let customer = await this.customerService.findByExternalId(
        Platform.FACEBOOK,
        sender.id,
      );

      if (!customer.avatar || !customer.name) {
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
        await this.conversationsService.handerUserMessage({
          channel: channel,
          message: {
            content: message.text,
            id: message.mid,
            createdAt: new Date(timestamp),
            // links: messageContent.links,
            contentType: 'text',
            senderType: 'user',
          },
          externalConversation: {
            id: sender.id,
            timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
          },
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

  /**
   * Handles sending a message from the bot to the conversation.
   */

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
            externalMessageId: zaloMsg?.data?.data.message_id,
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

  async handleOASendTextMessage(data: ZaloWebhookDto) {
    try {
      const { message, recipient, sender, timestamp } = data;
      const zaloChannel = await this.channelService.getByTypeAndAppId(
        ChannelType.ZALO,
        sender.id,
      );

      if (!zaloChannel) {
        return { message: 'Channel not found or not active' };
      }

      let customer = await this.customerService.findByExternalId(
        ChannelType.ZALO,
        recipient.id,
      );

      if (!customer) {
        const metadataCustomerZalo = await this.zaloService.getUserProfile(
          zaloChannel.accessToken,
          recipient.id,
        );

        customer = await this.customerService.findOrCreateByExternalId({
          platform: ChannelType.ZALO,
          externalId: recipient.id,
          avatar: metadataCustomerZalo.data.data.avatar,
          name: metadataCustomerZalo.data.data.display_name,
          channelId: zaloChannel.id,
        });
      }

      const {
        conversation,
        message: messageData,
        isNewConversation,
      } = await this.conversationsService.handleChannelMessage({
        channel: zaloChannel,
        customer: customer,
        externalConversation: {
          id: customer.externalId,
          timestamp: new Date(),
        },
        message: {
          content: message.text,
          contentType: MessageType.TEXT,
          senderType: SenderType.channel,
          id: message.msg_id,
          createdAt: new Date(timestamp),
        },
      });

      if (!conversation) {
        return;
      }

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
          avatar: zaloChannel.avatar,
          name: zaloChannel.name,
        },
        conversationId: conversation.id,
        channelType: ChannelType.ZALO,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to send OA message from Zalo to platform: ${error.message}`,
      );
    }
  }
}
