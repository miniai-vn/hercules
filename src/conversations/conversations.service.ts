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
import {
  ChannelMessageDto,
  SenderType,
  UserMessageDto,
} from 'src/messages/messages.dto';
import { Message } from 'src/messages/messages.entity';
import { MessagesService } from 'src/messages/messages.service';
import { TagsService } from 'src/tags/tags.service';
import { UsersService } from 'src/users/users.service';
import { FindManyOptions, Repository, Raw, Like } from 'typeorm';
import { ParticipantType } from '../conversation-members/conversation-members.entity';
import { ConversationMembersService } from '../conversation-members/conversation-members.service';
import { Conversation, ConversationType } from './conversations.entity';
import {
  AddParticipantsDto,
  ConversationQueryParamsDto,
  UpdateConversationDto,
} from './dto/conversation.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { PaginatedResult } from 'src/common/types/reponse.type';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    private readonly conversationMembersService: ConversationMembersService,
    private readonly messageService: MessagesService,
    private readonly tagsService: TagsService,
    private readonly customerService: CustomersService,
    private readonly userService: UsersService,
    @Inject(forwardRef(() => ChannelsService))
    private readonly channelService: ChannelsService,
  ) {}

  async create(createConversationDto: CreateConversationDto) {
    try {
      const {
        customerParticipantIds,
        userParticipantIds,
        ...conversationData
      } = createConversationDto;

      const conversation = this.conversationRepository.create({
        ...conversationData,
        channel: {
          id: createConversationDto.channelId,
        },
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

  async findOrCreateByExternalId(createConversationDto: CreateConversationDto) {
    const conversationExists = await this.conversationRepository.findOne({
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

    if (conversationExists) {
      return {
        conversation: conversationExists,
        isNewConversation: false,
      };
    }

    const conv = await this.create(createConversationDto);

    await this.addParticipants(conv.id, {
      userIds: createConversationDto.userParticipantIds || [],
      customerIds: createConversationDto.customerParticipantIds || [],
    });

    return {
      conversation: conv,
      isNewConversation: true,
    };
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

  async addParticipants(id: number, addParticipantsDto: AddParticipantsDto) {
    try {
      const conversation = await this.conversationRepository.findOne({
        where: { id },
        relations: {
          members: true,
        },
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
        relations: {
          members: {
            user: true,
            customer: true,
            lastMessage: true,
          },
        },
      });

      const message =
        await this.messageService.get50MessagesByConversationId(id);

      const messageMappingSender = await Promise.all(
        message.map(async (msg) => {
          const readMembers = conversation.members.filter(
            (member) => member.lastMessage?.id === msg.id,
          );

          const readBy = await Promise.all(
            readMembers.map(async (member) => {
              const user = await this.userService.getOne(member.userId);
              return {
                avatar: user.avatar,
                name: user.name,
                id: user.id,
              };
            }),
          );

          const sender = await this.getInfoSenderMessages(msg);

          return {
            ...msg,
            readBy,
            sender,
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

  async query(queryParams: ConversationQueryParamsDto): Promise<
    PaginatedResult<Conversation> & {
      unreadMessagesCount?: number;
    }
  > {
    try {
      const {
        page = 1,
        pageSize = 10,
        participantUserIds = [],
        phoneFilter,
        channelType,
        tagId,
        userId,
        channelId,
        search,
      } = queryParams;
      const whereConditions: FindManyOptions<Conversation> = {
        where: {
          ...(search && {
            name: Like(`%${search}%`), // sử dụng regex, không phân biệt hoa thường
            // Nếu muốn tìm cả trong content:
            // content: Raw(alias => `${alias} ~* :search`),
          }),
          ...(tagId && {
            tags: {
              id: tagId,
            },
          }),
          ...(userId && {
            members: {
              userId,
            },
          }),
          ...(channelId && {
            channel: {
              id: channelId,
            },
          }),
          ...(participantUserIds.length > 0 && {
            members: {
              userId: participantUserIds,
            },
          }),
          ...(phoneFilter &&
            typeof phoneFilter === 'string' && {
              members: {
                customer: {
                  phone: phoneFilter,
                },
              },
            }),
          ...(channelType && {
            channel: {
              type: channelType,
            },
          }),
        },
        relations: {
          members: {
            user: true,
            customer: {
              tags: true,
            },
          },
          channel: true,
          tags: true,
        },
      };

      const [conversations, count] =
        await this.conversationRepository.findAndCount({
          ...whereConditions,
          order: {
            lastMessageAt: 'DESC',
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
        });

      return {
        data: conversations.map((conversation) => ({
          ...conversation,
          unreadMessagesCount:
            conversation.members.find((member) => member.userId === userId)
              ?.unreadCount ?? 0,
        })),
        total: count,
        page,
        limit: pageSize,
        totalPages: Math.ceil(count / pageSize),
        hasNext: page * pageSize < count,
        hasPrev: page > 1,
      };
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

  async markReadConversation(conversationId: number, userId: string) {
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

      if (!lastMessage) {
        return null; // No messages to mark as read
      }
      await this.conversationMembersService.updateLastMessage(
        currentMembersId,
        lastMessage,
      );
      return {
        ...lastMessage,
        readBy: await this.getInfoSenderMessages(lastMessage),
      };
    } catch (error) {
      console.error('Error while marking conversation as read:', error);
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

  async removeParticipants(conversationId: number, participantIds: number[]) {
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

  /**
   * Update last message at
   * */

  async updateLastMessageAt(conversationId: number, lastMessageAt: Date) {
    try {
      await this.conversationRepository.update(conversationId, {
        lastMessageAt,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update last message at',
      );
    }
  }

  async handleUserMessage({
    channel,
    customer,
    message,
    externalConversation,
    isSync = false,
  }: {
    channel: Channel;
    customer: Customer;
    message: UserMessageDto;
    externalConversation: {
      id: string;
      timestamp: Date;
    };
    isSync?: boolean;
  }) {
    try {
      const adminChannels = await this.userService.findAdminChannel(channel.id);

      const { conversation, isNewConversation } =
        await this.findOrCreateByExternalId({
          name: customer.name,
          type: ConversationType.DIRECT,
          avatar: customer.avatar,
          content: message.content,
          isBot: false,
          externalId: externalConversation.id,
          channelId: channel.id,
          conversation: externalConversation,
          lastMessageAt: message.createdAt,
          customerParticipantIds: [customer.id],
          userParticipantIds: adminChannels.map((user) => user?.id),
        });

      const { data: messageData } = await this.messageService.upsert({
        content: message.content,
        contentType: message.contentType,
        externalId: message.id,
        conversationId: conversation.id,
        senderType: SenderType.customer,
        senderId: customer.id,
        links: message.links,
        createdAt: message?.createdAt,
      });

      if (
        message?.createdAt &&
        (!conversation.lastMessageAt ||
          message.createdAt > conversation.lastMessageAt)
      ) {
        await this.updateLastMessageAt(conversation.id, messageData.createdAt);
      }

      if (!isSync)
        this.conversationMembersService.incrementUnreadCount(
          conversation.members
            .filter((member) => member.participantType === ParticipantType.USER)
            .map((member) => member?.userId),
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
  }

  async handlePlatformMessage({
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

    const { data: messageData } = await this.messageService.upsert({
      content: message.content,
      externalId: message.externalMessageId,
      contentType: messageType,
      conversationId: conversation.id,
      senderType: SenderType.user,
      senderId: userId,
      createdAt: message.createdAt,
    });

    if (
      message.createdAt &&
      (!conversation.lastMessageAt ||
        message.createdAt > conversation.lastMessageAt)
    ) {
      await this.updateLastMessageAt(conversation.id, messageData.createdAt);
    }

    this.conversationMembersService.incrementUnreadCount(
      conversation.members
        .filter((member) => member.participantType === ParticipantType.USER)
        .map((member) => member.userId),
    );

    return {
      conversation,
      message: messageData,
    };
  }

  async handleChannelMessage({
    channel,
    message,
    customer,
    externalConversation,
    isSync = false,
  }: {
    channel: Channel;
    message: ChannelMessageDto;
    customer: Customer;
    externalConversation: {
      id: string;
      timestamp: Date;
    };
    isSync?: boolean;
  }) {
    try {
      const adminChannels = await this.userService.findAdminChannel(channel.id);

      const existingMessages = await this.messageService.findByExternalId(
        message.id,
      );
      const { conversation, isNewConversation } =
        await this.findOrCreateByExternalId({
          name: customer.name || 'Unknown Customer',
          type: ConversationType.DIRECT,
          avatar: customer.avatar,
          externalId: externalConversation.id,
          channelId: channel.id,
          conversation: externalConversation,
          customerParticipantIds: [customer.id],
          userParticipantIds: adminChannels.map((user) => user?.id),
        });

      if (existingMessages) {
        return {
          isNewConversation,
          conversation,
          message: null,
        };
      }

      // check message is exsting with externalId
      const { data: messageData } = await this.messageService.upsert({
        content: message.content ? message.content : '',
        contentType: message.contentType,
        senderType: SenderType.channel,
        senderId: channel.id.toString(),
        links: message.links,
        conversationId: conversation.id,
        externalId: message.id,
        createdAt: message.createdAt,
      });

      if (
        message.createdAt &&
        (!conversation.lastMessageAt ||
          message.createdAt > conversation.lastMessageAt)
      ) {
        await this.updateLastMessageAt(conversation.id, messageData.createdAt);
      }

      if (!isSync)
        this.conversationMembersService.incrementUnreadCount(
          conversation.members
            .filter((member) => member.participantType === ParticipantType.USER)
            .map((member) => member?.userId),
        );

      return {
        conversation,
        isNewConversation,
        message: messageData,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to send message to conversation with OA',
      );
    }
  }

  async handleAgentMessage({
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
      const { conversation } = await this.findOrCreateByExternalId({
        name: customer.name,
        type: ConversationType.DIRECT,
        avatar: customer.avatar,
        externalId: customer.externalId,
        channelId: channel.id,
        customerParticipantIds: [customer.id],
        userParticipantIds: adminChannels.map((user) => user.id),
      });

      const { data: messageData } = await this.messageService.upsert({
        content: message.content,
        contentType: message.type,
        senderType: SenderType.assistant,
        senderId: agentId.toString(),
        conversationId: conversation.id,
        externalId: message.externalMessageId,
      });

      return {
        message: messageData,
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

      await this.conversationRepository.save({
        ...conversation,
        isBot: !conversation.isBot,
      });

      return conversation.isBot;
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to update bot status',
      });
    }
  }

  private toResponseDto(conversation: Conversation) {
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
