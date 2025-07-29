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
import { SenderType } from 'src/messages/dto/messages.dto';
import { ConversationsService } from '../conversations/conversations.service';
import { ChatGateway } from './chat.gateway';
import { ZaloWebhookDto } from './dto/chat-zalo.dto';
import dayjs from 'dayjs';
import { KafkaProducerService } from 'src/kafka/kafka.producer';
import { Producer } from 'kafkajs';
import { Customer } from 'src/customers/customers.entity';
import { Message } from 'src/messages/messages.entity';

export interface SendMessageData {
  conversationId: number;
  content: string;
  userId: string;
  messageType?: string;
  shopId: string;
  isEcho: boolean;
}

@Injectable()
export class ChatService {
  private producer: Producer;
  constructor(
    private readonly chatGateway: ChatGateway,
    private readonly conversationsService: ConversationsService,
    private readonly channelService: ChannelsService,
    private readonly zaloService: ZaloService,
    private readonly customerService: CustomersService,
    private readonly facebookService: FacebookService,
    private readonly agentService: AgentsService,
    private readonly kafkaProducerService: KafkaProducerService,
  ) {
    this.producer = this.kafkaProducerService.getProducer();
  }

  /**
   * Handles incoming messages from Zalo and sends them to the platform.
   */

  async handleZaloMessage(data: ZaloWebhookDto) {
    try {
      const { message, recipient, sender } = data;
      const zaloChannel = await this.channelService.getByTypeAndAppId(
        ChannelType.ZALO,
        recipient.id,
      );

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
        const zaloCustomer = await this.zaloService.getUserProfile(
          zaloChannel.accessToken,
          sender.id,
        );

        customer = await this.customerService.upsertUser({
          platform: ChannelType.ZALO,
          externalId: sender.id,
          avatar: zaloCustomer.data.data.avatar,
          name: zaloCustomer.data.data.display_name,
          channelId: zaloChannel.id,
          tagNames: zaloCustomer.data.data.tags_and_notes_info.tag_names,
          note: zaloCustomer.data.data.tags_and_notes_info.note,
        });
      }

      const { conversation, messageData, isNewConversation } =
        await this.conversationsService.handleUserMessage({
          message: transferMessage,
          channel: zaloChannel,
          customer,
          externalConversation: {
            id: customer.externalId,
            timestamp: new Date(),
          },
        });

      this.notifyToClient({
        isNewConversation,
        conversation,
        customer,
        messageData,
      });

      this.handleBotMessage({
        conversation,
        message: transferMessage.content,
        shopId: zaloChannel.shop.id,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to send message from Zalo to platform: ${error.message}`,
      );
    }
  }

  /**
   * Notify to client with socket
   * */

  async notifyToClient({
    conversation,
    customer,
    messageData,
    isNewConversation,
  }: {
    isNewConversation: boolean;
    conversation: Conversation;
    customer: Customer; // Assuming customer is an object with avatar and name
    messageData: Message; // Assuming messageData is an object with message details
  }) {
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

    const roomName = `conversation:${conversation?.id}`;

    this.chatGateway.server.to(roomName).emit('receiveMessage', {
      ...messageData,
      sender: {
        avatar: customer?.avatar,
        name: customer?.name,
      },
      conversationId: conversation.id,
      channelType: ChannelType.ZALO,
    });
  }

  /**
   * Sends a message from the platform to an Omni-channel conversation.
   */

  async handleMessageToOmniChannel(data: SendMessageData) {
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
          await this.conversationsService.handlePlatformMessage({
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
      // if (channel.type === ChannelType.FACEBOOK) {
      //   const resp = await this.facebookService.sendMessageFacebook(
      //     channel.accessToken,
      //     customer.externalId,
      //     data.content,
      //     channel.appId,
      //   );

      //   const { message } =
      //     await this.conversationsService.handlePlatformMessage({
      //       conversationId: data.conversationId,
      //       message: {
      //         content: data.content,
      //         externalMessageId: resp.data.message_id,
      //       },
      //       userId: data.userId,
      //       messageType: data.messageType,
      //     });

      //   this.chatGateway.server.to(roomName).emit('receiveMessage', {
      //     ...message,
      //     conversationId: data.conversationId,
      //     channelType: ChannelType.FACEBOOK,
      //   });
      // }
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

        customer = await this.customerService.upsertUser({
          platform: Platform.FACEBOOK,
          externalId: sender.id,
          avatar: resp.profile_pic,
          name: resp.name,
          channelId: channel.id,
          shopId: channel.shop.id,
        });
      }

      const { conversation, messageData, isNewConversation } =
        await this.conversationsService.handleUserMessage({
          channel: channel,
          message: {
            content: message.text,
            id: message.mid,
            createdAt: new Date(timestamp),
            contentType: 'text',
            senderType: 'user',
          },
          externalConversation: {
            id: sender.id,
            timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
          },
          customer,
        });

      this.notifyToClient({
        isNewConversation,
        conversation,
        customer,
        messageData,
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

  async handleBotMessage({
    conversation,
    message,
    shopId,
  }: {
    conversation: Conversation;
    message: string;
    shopId: string;
  }) {
    const agents = await this.agentService.findByChannelId(
      conversation.channel.id,
    );

    const history = conversation.messages.slice(-10).map((msg) => ({
      role: msg.senderType as SenderType,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
    }));

    for (const agent of agents) {
      this.producer.send({
        topic: process.env.KAKFA_LLM_TOPIC,
        messages: [
          {
            value: JSON.stringify({
              conversationId: conversation.id,
              agentId: agent.id,
              message,
              history,
              prompt: agent.prompt,
              tenantId: `shop_${shopId.replace(/-/g, '')}`,
              parentCode: agent.departments.map((d) => d.id),
              config: agent.modelConfig,
              modelName: agent.modelName,
            }),
          },
        ],
      });
    }
  }

  async handleLLMTextResult(data: any) {
    return;
  }

  async handleOAMessage(data: ZaloWebhookDto) {
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

        customer = await this.customerService.upsertUser({
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
          timestamp: new Date(timestamp),
        },
        message: {
          content: message.text,
          contentType: MessageType.TEXT,
          senderType: SenderType.channel,
          id: message.msg_id,
          createdAt: dayjs(timestamp).toDate(),
        },
      });

      if (!messageData) return;

      this.notifyToClient({
        isNewConversation,
        conversation,
        customer,
        messageData,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to send OA message from Zalo to platform: ${error.message}`,
      );
    }
  }
}
