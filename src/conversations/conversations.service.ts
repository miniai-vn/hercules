import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Conversation } from './conversations.entity';
import { CustomersService } from '../customers/customers.service';
import {
  CreateConversationDto,
  UpdateConversationDto,
  ConversationQueryParamsDto,
  ConversationBulkDeleteDto,
  PaginatedConversationsDto,
  ConversationResponseDto,
  AddParticipantsDto,
  RemoveParticipantsDto,
} from './dto/conversation.dto';
import {
  ConversationListFEResponseDto,
  ConversationFEDto,
  UserDto,
  MessageDto,
} from './dto/conversation-fe.dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    private readonly customersService: CustomersService,
  ) {}

  async create(
    createConversationDto: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    const { customerParticipantIds, ...conversationData } =
      createConversationDto;

    // Create the conversation entity
    const conversation = this.conversationRepository.create(conversationData);

    // Handle customer participants
    if (customerParticipantIds && customerParticipantIds.length > 0) {
      const customers = [];

      for (const customerId of customerParticipantIds) {
        try {
          const customer = await this.customersService.findOne(customerId);
          customers.push(customer);
        } catch (error) {
          throw new BadRequestException(
            `Customer with ID ${customerId} not found`,
          );
        }
      }

      conversation.customers = customers;
    }

    const savedConversation =
      await this.conversationRepository.save(conversation);

    // Load the conversation with all relations for response
    const conversationWithRelations = await this.conversationRepository.findOne(
      {
        where: { id: savedConversation.id },
        relations: ['customers', 'messages'],
      },
    );

    return this.toResponseDto(conversationWithRelations);
  }

  async findAll(
    page: number,
    limit: number,
    search: string,
  ): Promise<PaginatedConversationsDto> {
    const offset = (page - 1) * limit;
    const queryBuilder = this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.customers', 'customers')
      .leftJoinAndSelect('conversation.messages', 'messages');

    if (search) {
      queryBuilder.where(
        'conversation.name ILIKE :search OR conversation.content ILIKE :search',
        { search: `%${search}%` },
      );
    }

    const [conversations, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .orderBy('conversation.createdAt', 'DESC')
      .getManyAndCount();

    return {
      conversations: conversations.map((conv) => this.toResponseDto(conv)),
      total,
      page,
      perPage: limit,
      totalPages: Math.ceil(total / limit),
    };
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

  async findOne(id: number): Promise<ConversationResponseDto> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: ['customers', 'messages'],
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    return this.toResponseDto(conversation);
  }

  async update(
    id: number,
    updateConversationDto: UpdateConversationDto,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: ['customers'],
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    const { customerParticipantIds, ...updateData } = updateConversationDto;

    // Update basic fields
    Object.assign(conversation, updateData);

    // Update customer participants if provided
    if (customerParticipantIds !== undefined) {
      if (customerParticipantIds.length > 0) {
        const customers = [];

        for (const customerId of customerParticipantIds) {
          try {
            const customer = await this.customersService.findOne(customerId);
            customers.push(customer);
          } catch (error) {
            throw new BadRequestException(
              `Customer with ID ${customerId} not found`,
            );
          }
        }

        conversation.customers = customers;
      } else {
        conversation.customers = [];
      }
    }

    const savedConversation =
      await this.conversationRepository.save(conversation);

    // Load with all relations for response
    const conversationWithRelations = await this.conversationRepository.findOne(
      {
        where: { id: savedConversation.id },
        relations: ['customers', 'messages'],
      },
    );

    return this.toResponseDto(conversationWithRelations);
  }

  async remove(id: number): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    await this.conversationRepository.remove(conversation);
  }

  async bulkDelete(bulkDeleteDto: ConversationBulkDeleteDto): Promise<{
    totalRequested: number;
    deletedCount: number;
    notFoundCount: number;
  }> {
    const { conversationIds } = bulkDeleteDto;
    const totalRequested = conversationIds.length;

    const existingConversations = await this.conversationRepository.findBy({
      id: In(conversationIds),
    });

    const deletedCount = existingConversations.length;
    const notFoundCount = totalRequested - deletedCount;

    if (existingConversations.length > 0) {
      await this.conversationRepository.remove(existingConversations);
    }

    return {
      totalRequested,
      deletedCount,
      notFoundCount,
    };
  }

  async addParticipants(
    id: number,
    addParticipantsDto: AddParticipantsDto,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: ['customers'],
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    // Add customer participants
    if (
      addParticipantsDto.customerIds &&
      addParticipantsDto.customerIds.length > 0
    ) {
      const newCustomers = [];

      for (const customerId of addParticipantsDto.customerIds) {
        try {
          const customer = await this.customersService.findOne(customerId);
          newCustomers.push(customer);
        } catch (error) {
          throw new BadRequestException(
            `Customer with ID ${customerId} not found`,
          );
        }
      }

      // Merge with existing participants (avoid duplicates)
      const existingCustomerIds = conversation.customers.map((c) => c.id);
      const customersToAdd = newCustomers.filter(
        (c) => !existingCustomerIds.includes(c.id),
      );
      conversation.customers.push(...customersToAdd);
    }

    const savedConversation =
      await this.conversationRepository.save(conversation);

    // Load with all relations for response
    const conversationWithRelations = await this.conversationRepository.findOne(
      {
        where: { id: savedConversation.id },
        relations: ['customers', 'messages'],
      },
    );

    return this.toResponseDto(conversationWithRelations);
  }

  async removeParticipants(
    id: number,
    removeParticipantsDto: RemoveParticipantsDto,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: ['customers'],
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    // Remove customer participants
    if (
      removeParticipantsDto.customerIds &&
      removeParticipantsDto.customerIds.length > 0
    ) {
      conversation.customers = conversation.customers.filter(
        (customer) => !removeParticipantsDto.customerIds.includes(customer.id),
      );
    }

    const savedConversation =
      await this.conversationRepository.save(conversation);

    // Load with all relations for response
    const conversationWithRelations = await this.conversationRepository.findOne(
      {
        where: { id: savedConversation.id },
        relations: ['customers', 'messages'],
      },
    );

    return this.toResponseDto(conversationWithRelations);
  }

  async getParticipants(id: number): Promise<{
    customers: any[];
    users: any[];
  }> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: ['customers'],
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    return {
      customers: conversation.customers || [],
      users: [], // Since we only have customer relationship in this entity
    };
  }

  async getConversationsForFrontend(): Promise<ConversationListFEResponseDto> {
    const conversations = await this.conversationRepository.find({
      relations: [
        'customers',
        'customers.shop',
        'customers.channel',
        'messages',
      ],
      order: { updatedAt: 'DESC' },
    });

    const conversationsFE: ConversationFEDto[] = conversations.map((conv) => {
      // Map customers to users format
      const participants: UserDto[] =
        conv.customers?.map((customer) => ({
          id: customer.id.toString(),
          name: customer.name || 'Unknown User',
          avatar: this.getAvatarUrl(customer),
          status: this.getRandomStatus(),
          platform: customer.platform,
        })) || [];

      // Get last message
      const lastMessage: MessageDto | null =
        conv.messages?.length > 0
          ? {
              id: conv.messages[conv.messages.length - 1].id.toString(),
              senderId: this.getSenderIdFromMessage(
                conv.messages[conv.messages.length - 1],
              ),
              content: conv.messages[conv.messages.length - 1].content || '',
              timestamp: conv.messages[conv.messages.length - 1].createdAt,
              type: this.mapContentTypeToFE(
                conv.messages[conv.messages.length - 1].contentType,
              ),
            }
          : null;

      return {
        id: conv.id.toString(),
        participants,
        lastMessage,
        unreadCount: this.calculateUnreadCount(conv),
        isGroup: conv.type === 'group',
        name: conv.name,
        channel: conv.channel,
      };
    });

    return {
      conversations: conversationsFE,
      total: conversationsFE.length,
    };
  }

  // Helper methods
  private getAvatarUrl(customer: any): string {
    // Generate avatar based on customer ID or use predefined ones
    const avatars = [
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1494790108755-2616b612b5aa?w=40&h=40&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face',
    ];

    return avatars[(customer.id - 1) % avatars.length];
  }

  private getRandomStatus(): 'online' | 'offline' | 'away' {
    const statuses: ('online' | 'offline' | 'away')[] = [
      'online',
      'offline',
      'away',
    ];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  private getSenderIdFromMessage(message: any): string {
    // Extract sender ID from message extra_data or use a default
    if (message.extraData && typeof message.extraData === 'object') {
      return message.extraData.senderId || '1';
    }
    return '1'; // Default to user "1"
  }

  private mapContentTypeToFE(contentType: string): 'text' | 'image' | 'file' {
    switch (contentType) {
      case 'text':
        return 'text';
      case 'image':
        return 'image';
      case 'file':
        return 'file';
      default:
        return 'text';
    }
  }

  private calculateUnreadCount(conversation: any): number {
    // Simple random unread count for demo
    // In real app, you'd track read/unread status per user
    return Math.floor(Math.random() * 3);
  }

  private toResponseDto(conversation: Conversation): ConversationResponseDto {
    return {
      id: conversation.id,
      name: conversation.name,
      type: conversation.type,
      content: conversation.content,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      customerParticipants: conversation.customers?.map((customer) => ({
        id: customer.id,
        name: customer.name,
        externalId: customer.externalId,
      })),
      messagesCount: conversation.messages?.length || 0,
    };
  }
}
