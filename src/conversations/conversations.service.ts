import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Channel } from 'src/channels/channels.entity';
import { ChannelType } from 'src/channels/dto/channel.dto';
import { AddParticipantDto } from 'src/conversation-members/conversation-members.dto';
import { CustomersService } from 'src/customers/customers.service';
import { SenderType } from 'src/messages/messages.dto';
import { MessagesService } from 'src/messages/messages.service';
import { TagsService } from 'src/tags/tags.service';
import { Repository } from 'typeorm';
import { ParticipantType } from '../conversation-members/conversation-members.entity';
import { ConversationMembersService } from '../conversation-members/conversation-members.service';
import { Conversation, ConversationType } from './conversations.entity';
import {
  AddParticipantsDto,
  ConversationQueryParamsDto,
  ConversationResponseDto,
  CreateConversationDto,
  PaginatedConversationsDto,
  UpdateConversationDto,
} from './dto/conversation.dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    private readonly conversationMembersService: ConversationMembersService,
    private readonly messagesService: MessagesService,
    private readonly tagsService: TagsService,
    private readonly customerService: CustomersService,
    private readonly userService: UsersService, // Assuming you have a UsersService to handle user-related logic
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

  async findAll(
    page: number,
    limit: number,
    search: string,
    shopId: string,
  ): Promise<PaginatedConversationsDto> {
    try {
      const offset = (page - 1) * limit;

      const queryBuilder = this.conversationRepository
        .createQueryBuilder('conversation')
        .leftJoin(
          'conversation_members',
          'members',
          'members.conversation_id = conversation.id',
        )
        .leftJoin(
          'customers',
          'customers',
          'customers.id = members.customer_id',
        )
        .leftJoin('shops', 'shops', 'shops.id = customers.shop_id')
        .leftJoin('users', 'users', 'users.id = members.user_id')
        .where('(shops.id = :shopId OR users.shop_id = :shopId)', { shopId })
        .andWhere('members.is_active = true');

      if (search) {
        queryBuilder.andWhere(
          '(conversation.name ~* :search OR conversation.content ~* :search)',
          { search: search },
        );
      }

      queryBuilder
        .groupBy('conversation.id')
        .skip(offset)
        .take(limit)
        .orderBy('conversation.updated_at', 'DESC');

      const [conversations, total] = await queryBuilder.getManyAndCount();

      return {
        conversations: conversations.map((conv) => this.toResponseDto(conv)),
        total,
        page,
        perPage: limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to get conversations');
    }
  }

  async findOne(id: number): Promise<ConversationResponseDto> {
    try {
      // Verify the conversation belongs to the shop through its members
      const conversation = await this.conversationRepository
        .createQueryBuilder('conversation')
        .leftJoinAndSelect('conversation.members', 'members')
        .leftJoinAndSelect('conversation.messages', 'messages')
        .where('conversation.id = :id', { id })
        .getOne();
      return this.toResponseDto(conversation);
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

        // if (customerParticipantIds && customerParticipantIds.length > 0) {
        //   const customerParticipants = customerParticipantIds.map(
        //     (customerId) => ({
        //       participantType: ParticipantType.CUSTOMER,
        //       customerId: customerId.toString(),
        //       role: 'member',
        //       notificationsEnabled: true,
        //     }),
        //   );
        //   newParticipants.push(...customerParticipants);
        // }

        // if (userParticipantIds && userParticipantIds.length > 0) {
        //   const userParticipants = userParticipantIds.map((userId) => ({
        //     participantType: ParticipantType.USER,
        //     userId,
        //     role: 'member',
        //     notificationsEnabled: true,
        //   }));
        //   newParticipants.push(...userParticipants);
        // }

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
      if (error instanceof NotFoundException) {
        throw error;
      }
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
        relations: [
          'messages',
          'members',
          'members.customer',
          'members.user',
          'tags',
        ],
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }
      const customers = conversation.members.filter(
        (member) => member.participantType === ParticipantType.CUSTOMER,
      );

      const messages = await Promise.all(
        conversation.messages.map(async (message) => ({
          ...message,
          sender: await this.messagesService.getInfoSenderMessages(message.id),
        })),
      );

      return {
        ...conversation,
        name:
          conversation.name ??
          customers[0].customer?.name ??
          'Unknown Customer',
        avatar: customers[0].customer?.avatar ?? '',
        senderId: customers[0].customer?.id,
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
        .leftJoinAndSelect('conversation.tags', 'tags')
        .orderBy('conversation.createdAt', 'DESC');

      if (queryParams.tagId) {
        queryBuilder.andWhere('tags.id = :tagId', { tagId: queryParams.tagId });
      }

      if (queryParams.channelType) {
        queryBuilder
          .leftJoinAndSelect('conversation.channel', 'channel')
          .where('channel.type = :channelType', {
            channelType: queryParams.channelType.toLocaleLowerCase(),
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

      if (queryParams.type) {
        queryBuilder.andWhere('conversation.type = :type', {
          type: queryParams.type,
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

      if (queryParams.timeFrom) {
        queryBuilder.andWhere('conversation.createdAt >= :createdAfter', {
          createdAfter: new Date(queryParams.timeFrom),
        });
      }

      if (queryParams.timeTo) {
        queryBuilder.andWhere('conversation.createdAt <= :timeTo', {
          timeTo: new Date(queryParams.timeTo),
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

      const conversaiontsResponse = conversations.map(async (conv) => {
        const countMessagesUnread = await this.getUnReadMessagesCount(
          conv.id,
          queryParams.userId,
        );
        const lastestMessage = conv.messages[conv.messages.length - 1].content;
        delete conv.messages;
        return {
          ...this.toResponseDto(conv),
          tags: conv.tags,
          unreadMessagesCount: countMessagesUnread,
          isRead: countMessagesUnread === 0,
          lastestMessage,
        };
      });
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
      const conversation = await this.conversationRepository
        .createQueryBuilder('conversation')
        .leftJoinAndSelect('conversation.messages', 'messages')
        .leftJoinAndSelect('conversation.members', 'members')
        .leftJoinAndSelect('members.lastMessage', 'lastMessage')
        .where('conversation.id = :conversationId', { conversationId })
        .getOne();

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
        relations: ['messages', 'members'],
      });

      const currentMembersId = conversation.members.find(
        (member) => member.userId === userId,
      )?.id;

      const lastMessage = conversation.messages.pop();
      await this.conversationMembersService.updateLastMessage(
        currentMembersId,
        {
          messageId: lastMessage.id,
        },
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

  async sendMessageToConversation({
    channel,
    customerId,
    message = '',
  }: {
    channel: Channel;
    customerId: string;
    message: string;
  }) {
    try {
      let conversation = await this.conversationRepository
        .createQueryBuilder('conversation')
        .leftJoinAndSelect('conversation.members', 'members')
        .leftJoinAndSelect('conversation.channel', 'channel')
        .leftJoinAndSelect('members.customer', 'customer')
        .where('customer.external_id = :customerId', { customerId })
        .andWhere('channel.id = :channelId', { channelId: channel.id })
        .getOne();

      const customer = await this.customerService.findOrCreateByExternalId({
        externalId: customerId,
        shopId: channel.shop.id,
        platform: ChannelType.ZALO,
        channelId: channel.id,
      });
      if (!conversation) {
        const adminChannels = await this.userService.findAdminChannel(
          channel.id,
        );
        conversation = await this.create(
          {
            name: 'New Conversation',
            type: ConversationType.DIRECT,
            content: '',
            customerParticipantIds: [customer.id],
            userParticipantIds: adminChannels.map((user) => user.id),
          },
          channel,
        );
      }

      const messageData = await this.messagesService.create({
        conversationId: conversation.id,
        content: message,
        contentType: 'text',
        senderType: SenderType.customer,
        senderId: customer.id,
      });

      return {
        conversation,
        messageData,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get conversation by channel and customer',
      );
    }
  }
  private toResponseDto(conversation: Conversation): ConversationResponseDto {
    return {
      id: conversation.id,
      name: conversation?.name,
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
