import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from 'src/conversations/conversations.entity';
import { In, IsNull, Not, Repository } from 'typeorm';
import {
  CreateMessageDto,
  MessageBulkDeleteDto,
  MessageQueryParamsDto,
  UpdateMessageDto,
} from './messages.dto';
import { Message } from './messages.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async create(createMessageDto: CreateMessageDto, conversation: Conversation) {
    const message = this.messageRepository.create({
      ...createMessageDto,
      conversation: conversation,
      senderType: createMessageDto.senderType as any, // Cast to match DeepPartial<SenderType>
    });
    const savedMessage = await this.messageRepository.save(message);
    return this.toResponseDto(savedMessage);
  }

  async upsert(createMessageDto: CreateMessageDto) {
    const upsertedMessage = await this.messageRepository.upsert(
      {
        ...createMessageDto,
        links: createMessageDto.links || [],
        conversation: {
          id: createMessageDto.conversationId,
        },
      },
      {
        conflictPaths: ['externalId'],
      },
    );

    return await this.messageRepository.findOne({
      where: { id: upsertedMessage.identifiers[0].id },
    });
  }

  async get50MessagesByConversationId(
    conversationId: number,
    page: number = 1,
    limit: number = 50,
  ) {
    const msgs = await this.messageRepository.find({
      where: { conversation: { id: conversationId } },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return msgs.reverse();
  }

  async findAll(
    page: number,
    limit: number,
    search: string,
    includeDeleted: boolean = false,
  ) {
    const offset = (page - 1) * limit;
    const queryBuilder = this.messageRepository.createQueryBuilder('message');

    if (!includeDeleted) {
      queryBuilder.where('message.deletedAt IS NULL');
    }

    if (search) {
      queryBuilder.andWhere(
        'message.content ILIKE :search OR message.intent ILIKE :search',
        { search: `%${search}%` },
      );
    }

    const [messages, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .orderBy('message.createdAt', 'DESC')
      .getManyAndCount();

    return {
      messages: messages.map((message) => this.toResponseDto(message)),
      total,
      page,
      perPage: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async query(queryParams: MessageQueryParamsDto) {
    const queryBuilder = this.messageRepository.createQueryBuilder('message');

    // Handle soft deletes
    const includeDeleted = queryParams.includeDeleted === 'true';
    if (!includeDeleted) {
      queryBuilder.where('message.deletedAt IS NULL');
    }

    if (queryParams.senderType) {
      queryBuilder.andWhere('message.senderType = :senderType', {
        senderType: queryParams.senderType,
      });
    }

    if (queryParams.contentType) {
      queryBuilder.andWhere('message.contentType ILIKE :contentType', {
        contentType: `%${queryParams.contentType}%`,
      });
    }

    if (queryParams.search) {
      queryBuilder.andWhere(
        '(message.content ILIKE :search OR message.intent ILIKE :search)',
        { search: `%${queryParams.search}%` },
      );
    }

    if (queryParams.conversationId) {
      queryBuilder.andWhere('message.conversationId = :conversationId', {
        conversationId: queryParams.conversationId,
      });
    }

    if (queryParams.intent) {
      queryBuilder.andWhere('message.intent ILIKE :intent', {
        intent: `%${queryParams.intent}%`,
      });
    }

    if (queryParams.createdAfter) {
      queryBuilder.andWhere('message.createdAt >= :createdAfter', {
        createdAfter: new Date(queryParams.createdAfter),
      });
    }

    if (queryParams.createdBefore) {
      queryBuilder.andWhere('message.createdAt <= :createdBefore', {
        createdBefore: new Date(queryParams.createdBefore),
      });
    }

    const messages = await queryBuilder
      .orderBy('message.createdAt', 'DESC')
      .getMany();

    return messages.map((message) => this.toResponseDto(message));
  }

  async findOne(id: number, includeDeleted: boolean = false): Promise<Message> {
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .where('message.id = :id', { id });

    if (!includeDeleted) {
      queryBuilder.andWhere('message.deletedAt IS NULL');
    }

    const message = await queryBuilder.getOne();

    return message;
  }

  async findByConversation(
    conversationId: number,
    page: number,
    limit: number,
    includeDeleted: boolean = false,
  ) {
    const offset = (page - 1) * limit;
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId });

    if (!includeDeleted) {
      queryBuilder.andWhere('message.deletedAt IS NULL');
    }

    const [messages, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .orderBy('message.createdAt', 'ASC') // Chronological order for conversation messages
      .getManyAndCount();

    return {
      messages: messages.map((message) => this.toResponseDto(message)),
      total,
      page,
      perPage: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: number, updateMessageDto: UpdateMessageDto) {
    const message = await this.messageRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    Object.assign(message, updateMessageDto);
    const savedMessage = await this.messageRepository.save(message);
    return this.toResponseDto(savedMessage);
  }

  async remove(id: number): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    await this.messageRepository.softDelete(id);
  }

  async permanentDelete(id: number): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    await this.messageRepository.delete(id);
  }

  async bulkDelete(bulkDeleteDto: MessageBulkDeleteDto): Promise<{
    totalRequested: number;
    deletedCount: number;
    notFoundCount: number;
  }> {
    const { messageIds } = bulkDeleteDto;
    const totalRequested = messageIds.length;

    const existingMessages = await this.messageRepository.find({
      where: { id: In(messageIds), deletedAt: IsNull() },
    });

    const deletedCount = existingMessages.length;
    const notFoundCount = totalRequested - deletedCount;

    if (existingMessages.length > 0) {
      await this.messageRepository.softDelete(
        existingMessages.map((m) => m.id),
      );
    }

    return {
      totalRequested,
      deletedCount,
      notFoundCount,
    };
  }

  async restoreOne(id: number) {
    const message = await this.messageRepository.findOne({
      where: { id, deletedAt: Not(IsNull()) },
      withDeleted: true,
    });

    if (!message) {
      throw new NotFoundException(`Deleted message with ID ${id} not found`);
    }

    await this.messageRepository.restore(id);

    const restoredMessage = await this.messageRepository.findOne({
      where: { id },
    });

    return this.toResponseDto(restoredMessage);
  }

  async deleteAllInConversation(
    conversationId: number,
  ): Promise<{ deletedCount: number }> {
    const messages = await this.messageRepository.find({
      where: { conversation: { id: conversationId }, deletedAt: IsNull() },
    });

    if (messages.length > 0) {
      await this.messageRepository.softDelete(messages.map((m) => m.id));
    }

    return { deletedCount: messages.length };
  }

  async markMessagesAsReadForPlatform({
    platform,
    conversationId,
    userExternalId,
    readToTime,
  }: {
    platform: string;
    conversationId: number;
    userExternalId: string;
    readToTime: Date;
  }): Promise<number> {
    const result = await this.messageRepository
      .createQueryBuilder()
      .update()
      .set({ readAt: readToTime })
      .where('conversation_id = :conversationId', { conversationId })
      .andWhere('sender_id != :userExternalId', { userExternalId }) // Đánh dấu các message người khác gửi
      .andWhere('created_at <= :readToTime', { readToTime })
      .andWhere('read_at IS NULL')
      .execute();

    return result.affected ?? 0;
  }

  async findByExternalId(externalId: string): Promise<Message | null> {
    const message = await this.messageRepository.findOne({
      where: { externalId, deletedAt: IsNull() },
    });

    if (!message) {
      return null;
    }

    return message;
  }
  private toResponseDto(message: Message) {
    return {
      id: message.id,
      senderType: message.senderType?.toString(),
      contentType: message.contentType,
      content: message.content,
      conversationId: message.conversation.id,
      intent: message.intent,
      extraData: message.extraData,
      tokenUsage: message.tokenUsage,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      deletedAt: message.deletedAt,
    };
  }
}
