import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatedResult } from 'src/common/types/reponse.type';
import { Conversation } from 'src/conversations/conversations.entity';
import { ConversationsService } from 'src/conversations/conversations.service';
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

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @Inject(forwardRef(() => ConversationsService))
    private readonly conversationService: ConversationsService,
  ) {}

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

  async query(
    queryParams: MessageQueryParamsDto,
  ): Promise<PaginatedResult<Message>> {
    const {
      senderType,
      contentType,
      search,
      conversationId,
      createdAfter,
      createdBefore,
      senderId,
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
        ...(senderId && { senderId }),
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
          sender: await this.conversationService.getInfoSenderMessages(message),
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
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      deletedAt: message.deletedAt,
    };
  }
}
