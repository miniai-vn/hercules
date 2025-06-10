import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ConversationsService } from '../conversations/conversations.service';
import { MessagesService } from '../messages/messages.service';
import { ZaloWebhookDto } from './dto/chat-zalo.dto';
import { ChannelsService } from 'src/channels/channels.service';
import { ChannelType } from 'src/channels/dto/channel.dto';

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
    private readonly messagesService: MessagesService,
    private readonly channelService: ChannelsService, // Assuming you have a ChannelService to handle channel-related logic
  ) {}

  async sendMessages(data: ZaloWebhookDto) {
    const { message, app_id, sender } = data;
    const zaloChannel = await this.channelService.getByTypeAndAppId(
      ChannelType.ZALO,
      app_id,
    );

    const conversation =
      await this.conversationsService.sendMessageToConversation({
        message: message.text,
        channel: zaloChannel,
        customerId: sender.id,
      });


    // const participants = conversation.members;

    // participants.forEach((participant) => {
    //   if (participant.userId) {
    //     this.chatGateway.server
    //       .to(`user:${participant.userId}`)
    //       .emit('receiveMessage', {
    //         message: message.text,
    //         userId: participant.userId,
    //         conversationId: conversation.id,
    //         messageType: 'text',
    //         timestamp: new Date(),
    //       });
    //   } else {
    //     throw new NotFoundException(
    //       `User with ID ${participant.userId} not found in conversation ${conversation.id}`,
    //     );
    //   }
    // });
  }
}
