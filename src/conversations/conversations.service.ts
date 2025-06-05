import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AddParticipantDto } from 'src/conversation-members/conversation-members.dto';
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
          '(conversation.name ILIKE :search OR conversation.content ILIKE :search)',
          { search: `%${search}%` },
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
        .where('conversation.id = :id', { id })
        .andWhere('members.is_active = true')
        .getOne();

      if (!conversation) {
        throw new NotFoundException('Conversation not found or not accessible');
      }

      return this.toResponseDto(conversation);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get conversation');
    }
  }

  async update(
    id: number,
    updateConversationDto: UpdateConversationDto,
  ): Promise<ConversationResponseDto> {
    try {
      // Verify conversation exists and belongs to shop
      await this.findOne(id);

      const { customerParticipantIds, userParticipantIds, ...updateData } =
        updateConversationDto;

      // Update conversation data
      await this.conversationRepository.update(id, updateData);

      // Handle participant updates if provided
      if (
        customerParticipantIds !== undefined ||
        userParticipantIds !== undefined
      ) {
        // Get current members
        const currentMembers =
          await this.conversationMembersService.getConversationMembers(id);

        // Remove all current members (soft delete)
        for (const member of currentMembers) {
          await this.conversationMembersService.removeParticipant(member.id);
        }

        // Add new participants
        const newParticipants: AddParticipantDto[] = [];

        if (customerParticipantIds && customerParticipantIds.length > 0) {
          const customerParticipants = customerParticipantIds.map(
            (customerId) => ({
              participantType: ParticipantType.CUSTOMER,
              customerId: customerId.toString(),
              role: 'member',
              notificationsEnabled: true,
            }),
          );
          newParticipants.push(...customerParticipants);
        }

        if (userParticipantIds && userParticipantIds.length > 0) {
          const userParticipants = userParticipantIds.map((userId) => ({
            participantType: ParticipantType.USER,
            userId,
            role: 'member',
            notificationsEnabled: true,
          }));
          newParticipants.push(...userParticipants);
        }

        if (newParticipants.length > 0) {
          await this.conversationMembersService.addMultipleParticipants(id, {
            participants: newParticipants,
          });
        }
      }

      // Return updated conversation
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
      // Verify conversation exists and belongs to shop
      await this.findOne(id);

      // Remove all members first (cascade will handle this, but being explicit)
      const members =
        await this.conversationMembersService.getConversationMembers(id);

      for (const member of members) {
        await this.conversationMembersService.removeParticipant(member.id);
      }

      // Remove the conversation
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

      // Add customer participants
      if (
        addParticipantsDto.customerIds &&
        addParticipantsDto.customerIds.length > 0
      ) {
        const customerParticipants = addParticipantsDto.customerIds.map(
          (customerId) => ({
            participantType: ParticipantType.CUSTOMER,
            customerId: customerId.toString(),
            role: 'member',
            notificationsEnabled: true,
          }),
        );
        participants.push(...customerParticipants);
      }

      // Add user participants
      if (addParticipantsDto.userIds && addParticipantsDto.userIds.length > 0) {
        const userParticipants = addParticipantsDto.userIds.map((userId) => ({
          participantType: ParticipantType.USER,
          userId,
          role: 'member',
          notificationsEnabled: true,
        }));
        participants.push(...userParticipants);
      }

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

  async getConversationMessages(id: number): Promise<ConversationResponseDto> {
    try {
      const conversation = await this.conversationRepository
        .createQueryBuilder('conversation')
        .leftJoinAndSelect('conversation.messages', 'messages')
        .where('conversation.id = :id', { id })
        .getOne();

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      return this.toResponseDto(conversation);
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
      .leftJoinAndSelect('conversation.customers', 'customers')
      .leftJoinAndSelect('conversation.messages', 'messages');

    if (queryParams.name) {
      queryBuilder.andWhere('conversation.name ILIKE :name', {
        name: `%${queryParams.name}%`,
      });
    }

    if (queryParams.type) {
      queryBuilder.andWhere('conversation.type = :type', {
        type: queryParams.type,
      });
    }

    if (queryParams.search) {
      queryBuilder.andWhere(
        '(conversation.name ILIKE :search OR conversation.content ILIKE :search)',
        { search: `%${queryParams.search}%` },
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

    return conversations.map((conv) => this.toResponseDto(conv));
  }

  private toResponseDto(conversation: Conversation): ConversationResponseDto {
    return {
      id: conversation.id,
      name: conversation.name,
      type: conversation.type,
      content: conversation.content,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messagesCount: conversation.messages?.length || 0,
    };
  }
}
