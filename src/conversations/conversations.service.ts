import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AddParticipantDto } from 'src/conversation-members/conversation-members.dto';
import { MessagesService } from 'src/messages/messages.service';
import { Repository } from 'typeorm';
import { ParticipantType } from '../conversation-members/conversation-members.entity';
import { ConversationMembersService } from '../conversation-members/conversation-members.service';
import { Conversation } from './conversations.entity';
import {
  AddParticipantsDto,
  ConversationQueryParamsDto,
  ConversationResponseDto,
  CreateConversationDto,
  PaginatedConversationsDto,
  UpdateConversationDto,
} from './dto/conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    private readonly conversationMembersService: ConversationMembersService,
    private readonly messagesService: MessagesService,
  ) {}

  async create(
    createConversationDto: CreateConversationDto,
    shopId: string,
  ): Promise<ConversationResponseDto> {
    try {
      const {
        customerParticipantIds,
        userParticipantIds,
        ...conversationData
      } = createConversationDto;

      // Create the conversation entity
      const conversation = this.conversationRepository.create({
        ...conversationData,
      });

      const savedConversation =
        await this.conversationRepository.save(conversation);

      // Add participants using ConversationMembersService
      if (customerParticipantIds && customerParticipantIds.length > 0) {
        const customerParticipants: AddParticipantDto[] =
          customerParticipantIds.map((customerId) => ({
            participantType: ParticipantType.CUSTOMER,
            customerId: customerId.toString(),
            role: 'member',
            notificationsEnabled: true,
          }));

        await this.conversationMembersService.addMultipleParticipants(
          savedConversation.id,
          { participants: customerParticipants },
        );
      }

      if (userParticipantIds && userParticipantIds.length > 0) {
        const userParticipants: AddParticipantDto[] = userParticipantIds.map(
          (userId) => ({
            participantType: ParticipantType.USER,
            userId,
            role: 'member',
            notificationsEnabled: true,
          }),
        );

        await this.conversationMembersService.addMultipleParticipants(
          savedConversation.id,
          { participants: userParticipants },
        );
      }

      return this.toResponseDto(savedConversation);
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
      const participants: AddParticipantDto[] = [];

      // if (
      //   addParticipantsDto.customerIds &&
      //   addParticipantsDto.customerIds.length > 0
      // ) {
      //   const customerParticipants = addParticipantsDto.customerIds.map(
      //     (customerId) => ({
      //       participantType: ParticipantType.CUSTOMER,
      //       customerId: customerId.toString(),
      //       role: 'member',
      //       notificationsEnabled: true,
      //     }),
      //   );
      //   participants.push(...customerParticipants);
      // }

      // // Add user participants
      // if (addParticipantsDto.userIds && addParticipantsDto.userIds.length > 0) {
      //   const userParticipants = addParticipantsDto.userIds.map((userId) => ({
      //     participantType: ParticipantType.USER,
      //     userId,
      //     role: 'member',
      //     notificationsEnabled: true,
      //   }));
      //   participants.push(...userParticipants);
      // }

      if (participants.length > 0) {
        await this.conversationMembersService.addMultipleParticipants(id, {
          participants,
        });
      }

      return this.findOne(id);
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
        .where('conversation.id = :conversationId', { conversationId })
        .getOne();

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      return conversation.members
        .filter((member) => member.participantType === ParticipantType.USER)
        .map((member) => ({
          id: member.id,
          memberType: member.participantType,
          systemId: member.userId,
          name: member.user?.name || 'Unknown User',
        }));
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Failed to get users in conversation',
      );
    }
  }

  async getFullInfoConversation(id: number) {
    try {
      const conversation = await this.conversationRepository
        .createQueryBuilder('conversation')
        .leftJoinAndSelect('conversation.messages', 'messages')
        .leftJoinAndSelect('messages.recipients', 'recipients')
        .leftJoinAndSelect('conversation.members', 'members')
        .leftJoinAndSelect('members.customer', 'customer')
        .where('conversation.id = :id', { id })
        .getOne();

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
    const queryBuilder = this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.messages', 'messages')
      .leftJoinAndSelect('conversation.members', 'members')
      .orderBy('conversation.createdAt', 'DESC');

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

    if (queryParams.customerParticipantId) {
      queryBuilder.andWhere('customers.id = :customerId', {
        customerId: queryParams.customerParticipantId,
      });
    }

    if (queryParams.createdAfter) {
      queryBuilder.andWhere('conversation.createdAt >= :createdAfter', {
        createdAfter: new Date(queryParams.createdAfter),
      });
    }

    if (queryParams.createdBefore) {
      queryBuilder.andWhere('conversation.createdAt <= :createdBefore', {
        createdBefore: new Date(queryParams.createdBefore),
      });
    }

    const conversations = await queryBuilder
      .orderBy('conversation.createdAt', 'DESC')
      .getMany();
    const conversaiontsResponse = conversations.map(async (conv) => {
      const countMessagesUnread = await this.getUnReadMessagesCount(conv.id);
      const lastestMessage = conv.messages[conv.messages.length - 1].content;
      delete conv.messages;
      return {
        ...this.toResponseDto(conv),
        unreadMessagesCount: countMessagesUnread,
        isRead: countMessagesUnread === 0,
        lastestMessage,
      };
    });
    return Promise.all(conversaiontsResponse);
  }

  async getUnReadMessagesCount(conversationId: number): Promise<number> {
    try {
      const count = await this.conversationRepository.find({
        where: { id: conversationId },
        relations: ['messages', 'messages.recipients'],
      });
      // .createQueryBuilder('conversation')
      // .leftJoinAndSelect('conversation.messages', 'messages')
      // .leftJoinAndSelect('messages.recipients', 'recipients')
      // .where('conversation.id = :conversationId', { conversationId })

      // .andWhere('recipients.is_read = false')
      // .getMany();
      console.log(count);
      return 0;
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
      const messageIds = conversation.messages.map((msg) => msg.id);
    } catch (error) {
      throw new InternalServerErrorException(
        'Server error while marking conversation as read',
      );
    }
  }

  private toResponseDto(conversation: Conversation): ConversationResponseDto {
    return {
      id: conversation.id,
      name: conversation.name,
      type: conversation.type,
      content: conversation.content,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: conversation.messages?.map((message) => ({
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        senderId: message.senderId, // Assuming messages have a senderId field
      })),

      customerParticipants: conversation.members.map((member) => ({
        id: member.id,
        memberType: member.participantType,
        systemId: member.customerId ?? member.userId,
        name: member.customer?.name || 'Unknown Customer',
      })),
      // messagesCount: conversation.messages?.length || 0,
    };
  }
}
