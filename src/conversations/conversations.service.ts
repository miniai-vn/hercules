import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Channel } from 'src/channels/channels.entity';
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
  UpdateConversationDto,
} from './dto/conversation.dto';
import { ChannelsService } from 'src/channels/channels.service';
import { MessageType } from 'src/common/enums/message.enum';

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

  async findByCustomerIdAndChannelId(
    customerId: string,
    channelId: number,
  ): Promise<Conversation | null> {
    return this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoin('conversation.members', 'members')
      .leftJoin('conversation.channel', 'channel')
      .where('members.customerId = :customerId', { customerId })
      .andWhere('channel.id = :channelId', { channelId })
      .getOne();
  }

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

  async findOne(id: number): Promise<Conversation> {
    try {
      const conversation = await this.conversationRepository.findOne({
        where: { id },
        relations: {
          members: true,
          channel: true,
          tags: true,
        },
      });

      return conversation;
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve conversation');
    }
  }

  async update(
    id: number,
    updateConversationDto: UpdateConversationDto,
  ): Promise<ConversationResponseDto> {
    try {
      const { customerParticipantIds, userParticipantIds, ...updateData } =
        updateConversationDto;

      await this.conversationRepository.update(id, updateData);

      if (
        customerParticipantIds !== undefined ||
        userParticipantIds !== undefined
      ) {
        const currentMembers =
          await this.conversationMembersService.getConversationMembers(id);

        for (const member of currentMembers) {
          await this.conversationMembersService.removeParticipant(member.id);
        }

        const newParticipants: AddParticipantDto[] = [];

        if (newParticipants.length > 0) {
          await this.conversationMembersService.addMultipleParticipants(id, {
            participants: newParticipants,
          });
        }
      }

      const updatedConversation = await this.conversationRepository.findOne({
        where: { id },
      });

      return this.toResponseDto(updatedConversation);
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
      const conversation = await this.conversationRepository
        .createQueryBuilder('conversation')
        .leftJoinAndSelect('conversation.members', 'members')
        .leftJoinAndSelect('members.user', 'user')
        .leftJoinAndSelect('members.customer', 'customer')
        .where('conversation.id = :conversationId', { conversationId })
        .getOne();
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
        relations: {
          members: {
            customer: true,
            user: true,
          },
          channel: true,
          messages: true,
          tags: true,
        },
        order: {
          messages: {
            createdAt: 'ASC',
          },
        },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      const messages = await Promise.all(
        conversation.messages.map(async (message) => {
          try {
            return {
              ...message,
              sender: await this.getInfoSenderMessages(message),
            };
          } catch (e) {
            // Log rõ ra message nào fail
            console.error('Lỗi khi get sender cho message:', message, e);
            return {
              ...message,
              sender: null, // hoặc object default
              error: e.message,
            };
          }
        }),
      );

      return {
        ...conversation,
        messages: messages,
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
          members: true,
          messages: true,
        },
        order: {
          messages: {
            createdAt: 'ASC',
          },
        },
      });

      const lastMessageId = conversation.members.find(
        (member) => member.userId === userId,
      )?.lastMessage?.id;

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

  async getTags(conversationId: number): Promise<ConversationResponseDto> {
    try {
      const conversation = await this.conversationRepository.findOne({
        where: { id: conversationId },
        relations: ['tags'],
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      return this.toResponseDto(conversation);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get tags for conversation',
      );
    }
  }

  async getConversationByChannelAndCustomer(
    channelId: number,
    customerId: string,
  ): Promise<Conversation> {
    try {
      const conversation = await this.conversationRepository.findOne({
        where: {
          members: {
            customer: {
              externalId: customerId,
            },
          },
          channel: {
            id: channelId,
          },
        },
        relations: {
          members: true,
          channel: true,
          messages: true,
        },
      });

      return conversation;
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
  }: {
    channel: Channel;
    customer: Customer;
    externalMessageId: string;
    message: string;
    type?: string;
  }) {
    try {
      let isNewConversation = false;

      let conversation = await this.getConversationByChannelAndCustomer(
        channel.id,
        customer.externalId,
      );

      if (!conversation) {
        const adminChannels = await this.userService.findAdminChannel(
          channel.id,
        );
        conversation = await this.create(
          {
            name: customer.name || 'Unknown Customer',
            type: ConversationType.DIRECT,
            avatar: customer.avatar || '',
            externalId: customer.externalId,
            customerParticipantIds: [customer.id],
            userParticipantIds: adminChannels.map((user) => user.id),
          },
          channel,
        );

        conversation = await this.conversationRepository.findOne({
          where: { id: conversation.id },
          relations: {
            members: true,
            channel: true,
            messages: true,
          },
        });
        isNewConversation = true;
      }

      const messageData = await this.messagesService.upsert(
        {
          content: message,
          contentType: type || MessageType.TEXT,
          externalId: externalMessageId,
          senderType: SenderType.customer,
          senderId: customer.id,
        },
        conversation,
      );

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
      // const channel = await this
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

    const metadataMessage = await this.messagesService.upsert(
      {
        content: message.content,
        externalId: message.externalMessageId,
        contentType: messageType,
        senderType: SenderType.user,
        senderId: userId,
      },
      conversation,
    );
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
    externalId,
    customer,
  }: {
    channel: Channel;
    message: any;
    externalId: string;
    customer: Customer;
  }) {
    try {
      let conversation = await this.getConversationByChannelAndCustomer(
        channel.id,
        externalId,
      );

      if (!conversation) {
        const adminChannels = await this.userService.findAdminChannel(
          channel.id,
        );
        conversation = await this.create(
          {
            name: customer.name || 'Unknown Customer',
            type: ConversationType.DIRECT,
            avatar: customer.avatar || '',
            externalId: customer.externalId,
            customerParticipantIds: [customer.id],
            userParticipantIds: adminChannels.map((user) => user.id),
          },
          channel,
        );

        conversation = await this.conversationRepository.findOne({
          where: { id: conversation.id },
          relations: {
            members: true,
            channel: true,
            messages: true,
          },
        });
      }

      const metadataMessage = await this.messagesService.upsert(
        {
          content: message.type === MessageType.TEXT ? message.message : '',
          contentType: message.type,
          senderType: SenderType.channel,
          senderId: channel.id.toString(),
          links: message.links,
          thumb: message.thumb,
          url: message.url,
          externalId: message.message_id,
        },
        conversation,
      );

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

  private toResponseDto(conversation: Conversation): ConversationResponseDto {
    return {
      id: conversation.id,
      name: conversation?.name,
      avatar: conversation?.avatar,
      type: conversation?.type,
      content: conversation?.content,
      createdAt: conversation?.createdAt,
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
    };
  }
}
