import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Channel } from 'src/channels/channels.entity';
import { ChannelsService } from 'src/channels/channels.service';
import { MessageType } from 'src/common/enums/message.enum';
import { AddParticipantDto } from 'src/conversation-members/conversation-members.dto';
import { Customer } from 'src/customers/customers.entity';
import { CustomersService } from 'src/customers/customers.service';
import { SenderType } from 'src/messages/messages.dto';
import { Message } from 'src/messages/messages.entity';
import { MessagesService } from 'src/messages/messages.service';
import { TagsService } from 'src/tags/tags.service';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { ParticipantType } from '../conversation-members/conversation-members.entity';
import { ConversationMembersService } from '../conversation-members/conversation-members.service';
import { Conversation, ConversationType } from './conversations.entity';
import {
  AddParticipantsDto,
  ConversationQueryParamsDto,
  ConversationResponseDto,
  CreateConversationDto,
  MarkReadPayloadDTO,
  UpdateConversationDto,
} from './dto/conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    private readonly conversationMembersService: ConversationMembersService,
    private readonly messagesService: MessagesService,
    private readonly tagsService: TagsService,
    private readonly customerService: CustomersService,
    private readonly userService: UsersService,
    @Inject(forwardRef(() => ChannelsService))
    private readonly channelService: ChannelsService,
  ) {}

  async create(createConversationDto: CreateConversationDto, channel: Channel) {
    try {
      const {
        customerParticipantIds,
        userParticipantIds,
        ...conversationData
      } = createConversationDto;

      const conversation = this.conversationRepository.create({
        ...conversationData,
        channel,
      });

      const savedConversation =
        await this.conversationRepository.save(conversation);

      await this.addParticipants(conversation.id, {
        userIds: userParticipantIds || [],
        customerIds: customerParticipantIds || [],
      });

      return savedConversation;
    } catch (error) {
      throw new InternalServerErrorException('Failed to create conversation');
    }
  }

  async upsert(createConversationDto: CreateConversationDto) {
    try {
      const conversationUpsert = await this.conversationRepository.upsert(
        {
          ...createConversationDto,
          // BUG: fill createdAt and updatedAt with the current date if not provided
          updatedAt: createConversationDto.conversation.timestamp || new Date(),
          channel: {
            id: createConversationDto.channelId,
          },
        },
        {
          conflictPaths: ['externalId', 'channel.id'],
        },
      );

      if (conversationUpsert.raw.length > 0) {
        await this.addParticipants(conversationUpsert.raw[0].id, {
          userIds: createConversationDto.userParticipantIds || [],
          customerIds: createConversationDto.customerParticipantIds || [],
        });
      }

      const conversation = await this.conversationRepository.findOne({
        where: {
          externalId: createConversationDto.externalId,
        },
        relations: {
          members: {
            customer: true,
            user: true,
          },
          channel: true,
          tags: true,
          messages: true,
        },
      });
      return {
        conversation,
        isNewConversation: conversationUpsert.raw.length !== 0,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to upsert conversation');
    }
  }

  async findOne(id: number): Promise<Conversation> {
    try {
      const conversation = await this.conversationRepository.findOne({
        where: { id },
        relations: {
          members: {
            customer: true,
            user: true,
            lastMessage: true,
          },
          channel: true,
          tags: true,
        },
      });

      return conversation;
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve conversation');
    }
  }

  async update(id: number, updateConversationDto: UpdateConversationDto) {
    try {
      await this.conversationRepository.update(id, updateConversationDto);
      const updatedConversation = await this.conversationRepository.findOne({
        where: { id },
      });

      return updatedConversation;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update conversation');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const members =
        await this.conversationMembersService.getConversationMembers(id);

      for (const member of members) {
        await this.conversationMembersService.removeParticipant(member.id);
      }

      await this.conversationRepository.delete(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to remove conversation');
    }
  }

  async addParticipants(
    id: number,
    addParticipantsDto: AddParticipantsDto,
  ): Promise<ConversationResponseDto> {
    try {
      const conversation = await this.conversationRepository.findOne({
        where: { id },
        relations: ['members'],
      });

      const { userIds, customerIds } = addParticipantsDto;
      if (userIds && userIds.length > 0) {
        const userParticipants: AddParticipantDto[] = userIds.map((userId) => ({
          participantType: ParticipantType.USER,
          userId,
          role: 'member',
          notificationsEnabled: true,
        }));

        await this.conversationMembersService.addMultipleParticipants(
          conversation.id,
          { participants: userParticipants },
        );
      }
      if (customerIds && customerIds.length > 0) {
        const customerParticipants: AddParticipantDto[] = customerIds.map(
          (customerId) => ({
            participantType: ParticipantType.CUSTOMER,
            customerId: customerId.toString(),
            role: 'member',
            notificationsEnabled: true,
          }),
        );

        await this.conversationMembersService.addMultipleParticipants(
          conversation.id,
          { participants: customerParticipants },
        );
      }

      return this.toResponseDto(conversation);
    } catch (error) {
      throw new InternalServerErrorException('Failed to add participants');
    }
  }

  async getUsersInConversation(conversationId: number) {
    try {
      const conversation = await this.conversationRepository.findOne({
        where: { id: conversationId },
        relations: {
          members: {
            user: true,
            customer: true,
          },
        },
      });
      const members = conversation.members.map((member) => {
        const memberType = member.user ?? member.customer;
        return {
          id: member.id,
          memberType: member.participantType,
          systemId: memberType.id,
          name: memberType.name || 'Unknown Participant',
          avatar: memberType.avatar || '',
          role: member?.memberSettings?.role ?? 'member',
        };
      });
      return members;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get users in conversation',
      );
    }
  }

  async getFullInfoConversation(id: number) {
    try {
      const conversation = await this.conversationRepository.findOne({
        where: { id },
      });
      const message =
        await this.messagesService.get50MessagesByConversationId(id);

      const messageMappingSender = await Promise.all(
        message.map(async (msg) => {
          return {
            ...msg,
            sender: await this.getInfoSenderMessages(msg),
          };
        }),
      );
      return {
        ...conversation,
        messages: messageMappingSender,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get conversation messages',
      );
    }
  }

  async query(
    queryParams: ConversationQueryParamsDto,
  ): Promise<ConversationResponseDto[]> {
    try {
      const queryBuilder = this.conversationRepository
        .createQueryBuilder('conversation')
        .leftJoinAndSelect('conversation.messages', 'messages')
        .leftJoinAndSelect('conversation.members', 'members')
        .leftJoinAndSelect('members.customer', 'customer')
        .leftJoinAndSelect('members.user', 'user')
        .leftJoinAndSelect('conversation.channel', 'channel')
        .leftJoinAndSelect('conversation.tags', 'tags')
        .leftJoinAndSelect('members.lastMessage', 'lastMessage')

        .where('channel.shop_id = :shopId', {
          shopId: queryParams.shopId,
        })
        // .limit(20)
        .orderBy('lastMessage.createdAt', 'DESC');

      if (queryParams.channelType) {
        queryBuilder.andWhere('channel.type = :channelType', {
          channelType: queryParams.channelType.toLocaleLowerCase(),
        });
      }

      if (queryParams.tagId) {
        queryBuilder.andWhere('tags.id = :tagId', {
          tagId: Number(queryParams.tagId),
        });
      }

      if (queryParams.userId) {
        queryBuilder.andWhere('members.user_id = :userId', {
          userId: queryParams.userId,
        });
      }

      if (queryParams.channelId) {
        queryBuilder.andWhere('conversation.channel_id = :channelId', {
          channelId: queryParams.channelId,
        });
      }

      if (queryParams.search && queryParams.search.trim() !== '') {
        queryBuilder.andWhere(
          '(conversation.name ~* :search OR conversation.content ~* :search)',
          { search: queryParams.search },
        );
      }

      if (
        queryParams.participantUserIds &&
        queryParams.participantUserIds.length > 0
      ) {
        queryBuilder.andWhere('user.id IN (:...participantUserIds)', {
          participantUserIds: queryParams.participantUserIds,
        });
      }

      // Fixed phoneFilter logic
      if (queryParams.phoneFilter) {
        queryBuilder.andWhere(
          'EXISTS (SELECT 1 FROM conversation_members cm JOIN customers c ON cm.customer_id = c.id WHERE cm.conversation_id = conversation.id AND c.phone IS NOT NULL)',
        );
      }
      // queryBuilder.limit(queryParams.limit || 20);
      // queryBuilder.offset(0);
      const conversations = await queryBuilder
        .orderBy('conversation.createdAt', 'DESC')
        .getMany();

      const conversationWithUnreadCount = await Promise.all(
        conversations.map(async (conv) => {
          const countMessagesUnread = await this.getUnReadMessagesCount(
            conv.id,
            queryParams.userId,
          );
          return {
            ...this.toResponseDto(conv),
            tags: conv.tags,
            channel: conv.channel,
            unreadMessagesCount: countMessagesUnread,
          };
        }),
      );

      const conversaiontsResponse = conversationWithUnreadCount.filter(
        (conv) => {
          if (queryParams.readStatus === 'read') {
            return conv.unreadMessagesCount === 0;
          }
          if (queryParams.readStatus === 'unread') {
            return conv.unreadMessagesCount > 0;
          }
          return conv;
        },
      );
      return Promise.all(conversaiontsResponse);
    } catch (error) {
      throw new InternalServerErrorException('Failed to query conversations');
    }
  }

  async getUnReadMessagesCount(
    conversationId: number,
    userId: string,
  ): Promise<number> {
    try {
      const conversation = await this.conversationRepository.findOne({
        where: { id: conversationId },
        relations: {
          members: {
            lastMessage: true,
          },
          messages: true,
        },
        order: {
          messages: {
            createdAt: 'ASC',
          },
        },
      });

      const lastMessageId =
        conversation.members.find((member) => member.userId === userId)
          ?.lastMessage?.id ?? 0;

      const messages = conversation.messages.filter(
        (msg) => msg.id > lastMessageId,
      );

      return messages.length;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get unread messages count',
      );
    }
  }

  async markReadConversation(
    conversationId: number,
    userId: string,
  ): Promise<void> {
    try {
      const conversation = await this.conversationRepository.findOne({
        where: { id: conversationId },
        relations: {
          messages: true,
          members: true,
        },
        order: {
          messages: {
            createdAt: 'ASC',
          },
        },
      });

      const currentMembersId = conversation.members.find(
        (member) => member.userId === userId,
      )?.id;

      const lastMessage = conversation.messages.pop();
      await this.conversationMembersService.updateLastMessage(
        currentMembersId,
        lastMessage,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Server error while marking conversation as read',
      );
    }
  }

  async addTagsToConversation(
    conversationId: number,
    tagIds: number[],
  ): Promise<void> {
    try {
      const conversation = await this.conversationRepository.findOne({
        where: { id: conversationId },
        relations: ['tags'],
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }
      const tags = await this.tagsService.findByIds(tagIds);
      conversation.tags = tags;
      await this.conversationRepository.save(conversation);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to add tags to conversation',
      );
    }
  }

  async removeParticipants(
    conversationId: number,
    participantIds: number[],
  ): Promise<ConversationResponseDto> {
    try {
      const conversation = await this.conversationRepository.findOne({
        where: { id: conversationId },
        relations: ['members'],
      });

      for (const participantId of participantIds) {
        const member = conversation.members.find((m) => m.id === participantId);
        if (member) {
          await this.conversationMembersService.removeParticipant(member.id);
        }
      }

      return this.toResponseDto(conversation);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to remove participants from conversation',
      );
    }
  }

  async checkAgentActive(channelId: number, externalId: string) {
    try {
      const conversation = await this.conversationRepository.findOne({
        where: {
          members: {
            customer: {
              externalId: externalId,
            },
          },
          channel: {
            id: channelId,
          },
        },
      });

      return conversation === null ? true : conversation?.isBot;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get conversation by channel and customer',
      );
    }
  }

  async sendMessageToConversation({
    channel,
    customer,
    externalMessageId,
    message = '',
    type,
    externalConversation,
  }: {
    channel: Channel;
    customer: Customer;
    externalMessageId: string;
    message: string;
    type?: string;
    externalConversation?: {
      id: string;
      timestamp: Date;
    };
  }) {
    try {
      const adminChannels = await this.userService.findAdminChannel(channel.id);
      const checkedChannelActiveAgent =
        await this.channelService.checkActiveAgent(channel.id);
      const checkConversationActive = await this.checkAgentActive(
        channel.id,
        customer.externalId,
      );

      const { conversation, isNewConversation } = await this.upsert({
        name: customer.name,
        type: ConversationType.DIRECT,
        avatar: customer.avatar,
        isBot: checkedChannelActiveAgent && checkConversationActive,
        externalId: externalConversation?.id,
        channelId: channel.id,
        conversation: {
          id: externalConversation?.id || '',
          timestamp: externalConversation?.timestamp || new Date(),
        },

        customerParticipantIds: [customer.id],
        userParticipantIds: adminChannels.map((user) => user.id),
      });

      const messageData = await this.messagesService.upsert({
        content: message,
        contentType: type || MessageType.TEXT,
        externalId: externalMessageId,
        conversationId: conversation.id,
        senderType: SenderType.customer,
        senderId: customer.id,
      });

      return {
        conversation,
        messageData,
        isNewConversation,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get conversation by channel and customer',
      );
    }
  }

  async getInfoSenderMessages(message: Message) {
    if (message.senderType === SenderType.channel) {
      const id = Number(message.senderId);
      const channel = await this.channelService.getOne(id);
      return {
        id: message.id,
        senderType: message.senderType,
        senderId: message.senderId,
        name: channel.name,
        avatar: channel.avatar,
      };
    }
    if (message.senderType === SenderType.customer) {
      const customer = await this.customerService.findOne(message.senderId);
      return {
        id: message.id,
        senderType: message.senderType,
        senderId: message.senderId,
        name: customer.name,
        avatar: customer?.avatar,
      };
    }

    if (message.senderType === SenderType.user) {
      const user = await this.userService.getOne(message.senderId);
      return {
        id: message.id,
        senderType: message.senderType,
        senderId: message.senderId,
        name: user.name,
        avatar: user.avatar,
      };
    }
  }

  async getConversationByUserId(userId: string) {
    try {
      const conversations = await this.conversationRepository.find({
        where: {
          members: {
            userId,
          },
        },
        relations: {
          members: true,
        },
      });
      return conversations;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get conversations by user ID',
      );
    }
  }

  async sendMessageToOtherPlatform({
    conversationId,
    message,
    userId,
    messageType,
  }: {
    conversationId: number;
    message: any;
    userId: string;
    messageType: string;
  }) {
    const conversation = await this.findOne(conversationId);

    if (!conversation) {
      throw new Error('Conversation not found');
    }
    const channel = conversation.channel;
    if (!channel) {
      throw new Error('Channel not found for the conversation');
    }
    const customerId = conversation.members.find(
      (member) => member.participantType === ParticipantType.CUSTOMER,
    )?.customerId;

    const metadataMessage = await this.messagesService.upsert({
      content: message.content,
      externalId: message.externalMessageId,
      contentType: messageType,
      conversationId: conversation.id,
      senderType: SenderType.user,
      senderId: userId,
    });
    return {
      accessToken: channel.accessToken,
      message: metadataMessage,
      customerId,
      channelType: channel.type,
    };
  }

  async sendMessageToConversationWithOthers({
    channel,
    message,
    customer,
    externalConversationId,
  }: {
    channel: Channel;
    message: any;
    customer: Customer;
    externalConversationId?: string;
  }) {
    try {
      const adminChannels = await this.userService.findAdminChannel(channel.id);
      const { conversation } = await this.upsert({
        name: customer.name || 'Unknown Customer',
        type: ConversationType.DIRECT,
        avatar: customer.avatar || '',
        externalId: externalConversationId,
        channelId: channel.id,
        customerParticipantIds: [customer.id],
        userParticipantIds: adminChannels.map((user) => user.id),
      });

      const metadataMessage = await this.messagesService.upsert({
        content: message.type === MessageType.TEXT ? message.message : '',
        contentType: message.type,
        senderType: SenderType.channel,
        senderId: channel.id.toString(),
        links: message.links,
        thumb: message.thumb,
        conversationId: conversation.id,
        url: message.url,
        externalId: message.message_id,
      });

      return {
        accessToken: channel.accessToken,
        message: metadataMessage,
        customerId: conversation.members[0].customerId,
        channelType: channel.type,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to send message to conversation with OA',
      );
    }
  }

  async sendAgentMessageToConversation({
    agentId,
    channel,
    message,
    customer,
  }: {
    agentId: number;
    channel: Channel;
    message: {
      content: string;
      type: MessageType;
      externalMessageId?: string;
    };
    customer: Customer;
  }) {
    try {
      const adminChannels = await this.userService.findAdminChannel(channel.id);
      const { conversation } = await this.upsert({
        name: customer.name,
        type: ConversationType.DIRECT,
        avatar: customer.avatar,
        externalId: customer.externalId,
        channelId: channel.id,
        customerParticipantIds: [customer.id],
        userParticipantIds: adminChannels.map((user) => user.id),
      });

      const metadataMessage = await this.messagesService.upsert({
        content: message.content,
        contentType: message.type,
        senderType: SenderType.assistant,
        senderId: agentId.toString(),
        conversationId: conversation.id,
        externalId: message.externalMessageId,
      });

      return {
        accessToken: channel.accessToken,
        message: metadataMessage,
        customerId: conversation.members[0].customerId,
        channelType: channel.type,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to send agent message to conversation',
      );
    }
  }
  async updateBotStatus(conversationId: number): Promise<boolean> {
    try {
      const conversation = await this.conversationRepository.findOne({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      conversation.isBot = !conversation.isBot;
      await this.conversationRepository.save(conversation);

      return conversation.isBot;
    } catch (error) {
      throw new InternalServerErrorException('Failed to update bot status');
    }
  }

  private toResponseDto(conversation: Conversation): ConversationResponseDto {
    return {
      id: conversation.id,
      name: conversation?.name,
      avatar: conversation?.avatar,
      type: conversation?.type,
      content: conversation?.content,
      createdAt: conversation?.createdAt,
      isBot: conversation?.isBot,
      updatedAt: conversation?.updatedAt,
      messages: conversation?.messages?.map((message) => ({
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        senderId: message.senderId,
      })),

      customerParticipants: conversation?.members.map((member) => ({
        id: member.id,
        memberType: member.participantType,
        systemId: member.customerId ?? member.userId,
        name: member.customer?.name || 'Unknown Customer',
      })),

      lastestMessage:
        conversation?.messages && conversation.messages.length > 0
          ? conversation.messages.at(-1)?.content
          : '',
    };
  }
}
