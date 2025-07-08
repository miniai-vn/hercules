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
import { MessagesService } from 'src/messages/messages.service';
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
          message: {
            content: message.text,
            id: message.msg_id,
            createdAt: new Date(),
          },
          channel: zaloChannel,
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
        sender: {
          avatar: customer.avatar,
          name: customer.name,
        },
        conversationId: conversation.id,
        channelType: ChannelType.ZALO,
      });
      // if (conversation.isBot) {
      //   this.botSendMessage(conversation, message.text);
      // }
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
      throw new InternalServerErrorException(
        `Failed to send message to other platform: ${error.message}`,
      );
    }
  }

  async sendMessagesFacebookToPlatform(data: FacebookEventDTO) {
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

      const messageContent = this.parseMessageContent(message);

      const { conversation, messageData, isNewConversation } =
        await this.conversationsService.sendMessageToConversation({
          channel: channel,
          externalMessageId: message.mid,
          message: {
            content: message.text,
            id: message.mid,
            createdAt: new Date(timestamp),
            url: messageContent.url,
            thumb: messageContent.thumb,
            links: messageContent.links,
          },
          type: messageContent.type,
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

  private parseMessageContent(message: {
    text?: string;
    attachments?: {
      type: string;
      url?: string;
      payload?: {
        url?: string;
        thumb?: string;
      };
    }[];
  }) {
    if (message.text) {
      return {
        content: message.text,
        type: MessageType.TEXT,
      };
    }
    if (message.attachments && message.attachments.length > 0) {
      const firstAttachment = message.attachments[0];
      const type = firstAttachment.type;

      const urls = message.attachments
        .filter((att) => att.type === type)
        .map((att) => att.payload?.url || att.url)
        .filter(Boolean);

      if (type === MessageType.IMAGE || type === MessageType.STICKER) {
        if (urls.length === 1) {
          return {
            content: null,
            type,
            url: urls[0],
            thumb: firstAttachment.payload?.thumb || urls[0],
          };
        }
        return {
          content: null,
          type,
          links: urls,
        };
      }

      if (
        type === MessageType.FILE ||
        type === MessageType.VIDEO ||
        type === MessageType.AUDIO
      ) {
        if (urls.length === 1) {
          return {
            content: null,
            type,
            url: urls[0],
          };
        }
        return {
          content: null,
          type,
          links: urls,
        };
      }

      // Các loại khác
      return {
        content: urls[0] || '',
        type,
        links: urls.length > 1 ? urls : undefined,
      };
    }
    // Nếu không có text và không có attachments
    return {
      content: '',
      type: 'unknown',
    };
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
      } = await this.conversationsService.sendMessageToConversationWithOthers({
        channel: zaloChannel,
        customer: customer,
        externalConversation: {
          id: customer.externalId,
          timestamp: new Date(),
        },
        message: {
          content: message.text,
          type: MessageType.TEXT,
          message_id: message.msg_id,
          createdAt: new Date(Number(timestamp)),
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

  async handleUserSeenMessage(data: ZaloWebhookDto) {}
}
