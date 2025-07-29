import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from 'src/conversations/conversations.entity';
import {
  FindManyOptions,
  In,
  IsNull,
  LessThan,
  Like,
  MoreThan,
  Not,
  Repository,
} from 'typeorm';
import {
  CreateMessageDto,
  MessageBulkDeleteDto,
  MessageQueryParamsDto,
  UpdateMessageDto,
} from './dto/messages.dto';
import { Message } from './messages.entity';
import { PaginatedResult } from 'src/common/types/reponse.type';
import { ConversationsService } from 'src/conversations/conversations.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @Inject(forwardRef(() => ConversationsService))
    private readonly conversationService: ConversationsService,
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

    return {
      data: await this.messageRepository.findOne({
        where: { id: upsertedMessage.identifiers[0].id },
      }),
      isNewMessage: upsertedMessage.identifiers.length > 0,
    };
  }

  async getRecentMessages(
    conversationId: number,
    page: number = 1,
    limit: number = 50,
    nextBeforeMessageId?: number,
    nextAfterMessageId?: number,
  ) {
    if (nextBeforeMessageId) {
      const msg = await this.messageRepository.findOne({
        where: { id: nextBeforeMessageId },
      });
      return await this.messageRepository.find({
        where: {
          conversation: { id: conversationId },
          createdAt: LessThan(msg.createdAt),
        },
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    if (nextAfterMessageId) {
      const msg = await this.messageRepository.findOne({
        where: { id: nextAfterMessageId },
      });
      return await this.messageRepository.find({
        where: {
          conversation: { id: conversationId },
          createdAt: MoreThan(msg.createdAt),
        },
        order: { createdAt: 'ASC' },
        skip: (page - 1) * limit,
        take: limit,
      });
    }
    return await this.messageRepository.find({
      where: { conversation: { id: conversationId } },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
  async getContextMessages(
    conversationId: number,
    messageId: number,
    page: number = 1,
    limit: number = 5,
  ) {
    const msg = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    const afterMessage = await this.messageRepository.find({
      where: {
        conversation: { id: conversationId },
        createdAt: MoreThan(msg.createdAt),
      },
      order: { createdAt: 'ASC' },
      take: limit,
    });

    const beforeMessage = await this.messageRepository.find({
      where: {
        conversation: { id: conversationId },
        createdAt: LessThan(msg.createdAt),
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    const contextMessages = [...beforeMessage, msg, ...afterMessage];

    return contextMessages;
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
  async query(
    queryParams: MessageQueryParamsDto,
  ): Promise<PaginatedResult<Message>> {
    const {
      senderType,
      contentType,
      search,
      conversationId,
      intent,
      createdAfter,
      createdBefore,
      limit = 50,
      page = 1,
    } = queryParams;
    const findOperations: FindManyOptions<Message> = {
      where: {
        ...(senderType && { senderType }),
        ...(contentType && { contentType }),
        ...(search && {
          content: Like(`%${search}%`),
        }),
        ...(conversationId && { conversation: { id: conversationId } }),
        ...(intent && { intent }),
        ...(createdAfter && {
          createdAt: MoreThan(new Date(createdAfter)),
        }),
        ...(createdBefore && {
          createdAt: LessThan(new Date(createdBefore)),
        }),
      },

      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    };
    const [messages, total] =
      await this.messageRepository.findAndCount(findOperations);

    const responseMessages = await Promise.all(
      messages.map(async (message) => {
        return {
          ...message,
          sentBy: await this.conversationService.getInfoSenderMessages(message),
        };
      }),
    );

    return {
      data: responseMessages,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNext: total > page * limit,
      hasPrev: page > 1,
      limit,
    };
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
