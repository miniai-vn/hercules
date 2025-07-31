import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { ConversationsService } from '../conversations/conversations.service';
import { ChannelsService } from 'src/channels/channels.service';
import { ZaloService } from 'src/integration/zalo/zalo.service';
import { CustomersService } from 'src/customers/customers.service';
import { FacebookService } from 'src/integration/facebook/facebook.service';
import { AgentsService } from 'src/agents/agents.service';
import { AgentServiceService } from 'src/integration/agent-service/agent-service.service';
import { KafkaProducerService } from 'src/kafka/kafka.producer';
import { ChatService } from './chat.service';

jest.mock('kafkajs', () => ({
  Kafka: jest.fn().mockImplementation(() => ({
    producer: () => ({
      send: jest.fn(),
    }),
  })),
}));

describe('ChatService', () => {
  let service: ChatService;
  let conversationsService: ConversationsService;
  let zaloService: ZaloService;
  let customersService: CustomersService;
  let kafkaProducerMock: { send: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: ChatGateway,
          useValue: {
            server: { to: jest.fn().mockReturnValue({ emit: jest.fn() }) },
            sendEventJoinConversation: jest.fn(),
          },
        },
        {
          provide: ConversationsService,
          useValue: {
            handerUserMessage: jest.fn(),
            sendMessageToOtherPlatform: jest.fn(),
            handleAgentMessage: jest.fn(),
            handleChannelMessage: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: ChannelsService,
          useValue: {
            getByTypeAndAppId: jest.fn(),
          },
        },
        {
          provide: ZaloService,
          useValue: {
            getUserProfile: jest.fn(),
            sendMessage: jest.fn(),
          },
        },
        {
          provide: CustomersService,
          useValue: {
            findByExternalId: jest.fn(),
            findOrCreateByExternalId: jest.fn(),
          },
        },
        {
          provide: FacebookService,
          useValue: {
            getUserProfile: jest.fn(),
            sendMessageFacebook: jest.fn(),
          },
        },
        {
          provide: AgentsService,
          useValue: { findByChannelId: jest.fn() },
        },
        {
          provide: AgentServiceService,
          useValue: { askQuestion: jest.fn() },
        },
        {
          provide: KafkaProducerService,
          useValue: {
            getProducer: jest.fn().mockReturnValue({
              send: jest.fn(),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    conversationsService = module.get(ConversationsService);
    zaloService = module.get(ZaloService);
    customersService = module.get(CustomersService);
    kafkaProducerMock = service['producer'] as any;
  });

  describe('handleZaloMessage', () => {
    it('should process and send Zalo message', async () => {
      const dto = {
        sender: { id: 'sender_id' },
        recipient: { id: 'app_id' },
        message: { text: 'hello', msg_id: 'abc123' },
      };

      const mockChannel = { id: 1, accessToken: 'token' };
      const mockCustomer = {
        externalId: 'sender_id',
        avatar: 'avatar',
        name: 'name',
      };

      const mockConversation = {
        id: 10,
        members: [],
      };

      const mockMessageData = { content: 'hello' };

      (
        service['channelService'].getByTypeAndAppId as jest.Mock
      ).mockResolvedValue(mockChannel);
      (customersService.findByExternalId as jest.Mock).mockResolvedValue(null);
      (zaloService.getUserProfile as jest.Mock).mockResolvedValue({
        data: { data: { avatar: 'avatar', display_name: 'name' } },
      });
      (
        customersService.upsertUser as jest.Mock
      ).mockResolvedValue(mockCustomer);
      (conversationsService.handleUserMessage as jest.Mock).mockResolvedValue({
        conversation: mockConversation,
        messageData: mockMessageData,
        isNewConversation: false,
      });

      await expect(
        service.handleZaloMessage(dto as any),
      ).resolves.toBeUndefined();

      expect(kafkaProducerMock.send).toHaveBeenCalled();
    });

    it('should return error if channel not found', async () => {
      (
        service['channelService'].getByTypeAndAppId as jest.Mock
      ).mockResolvedValue(null);
      const dto = {
        sender: { id: 'sender_id' },
        recipient: { id: 'wrong_id' },
        message: { text: 'test', msg_id: 'abc' },
      };
      const result = await service.handleZaloMessage(dto as any);
      expect(result).toEqual({ message: 'Channel not found or not active' });
    });
  });

  describe('handleMessageToOmniChannel', () => {
    it('should send Zalo message and emit event', async () => {
      const data = {
        conversationId: 1,
        content: 'hi',
        userId: 'user1',
        shopId: 'shop1',
        isEcho: false,
        messageType: 'text',
      };

      const mockConversation = {
        id: 1,
        isBot: false,
        members: [{ customerId: 1, customer: { externalId: 'zalo_user' } }],
        channel: { type: 'ZALO', accessToken: 'token' },
      };

      (conversationsService.findOne as jest.Mock).mockResolvedValue(
        mockConversation,
      );
      (zaloService.sendMessage as jest.Mock).mockResolvedValue({
        data: { data: { message_id: 'msg123' } },
      });
      (
        conversationsService.handlePlatformMessage as jest.Mock
      ).mockResolvedValue({
        message: { content: 'hi', id: 123 },
      });

      await service.handleSendPlatformMessage(data);

      expect(zaloService.sendMessage).toHaveBeenCalled();
    });

    it('should return error if bot conversation', async () => {
      const mockConversation = { isBot: true };
      (conversationsService.findOne as jest.Mock).mockResolvedValue(
        mockConversation,
      );

      const result = await service.handleSendPlatformMessage({
        conversationId: 1,
        content: 'hi',
        userId: 'user1',
        shopId: 'shop1',
        isEcho: false,
      });

      expect(result.status).toBe('BOT_IS_ACTIVE');
    });
  });
});
