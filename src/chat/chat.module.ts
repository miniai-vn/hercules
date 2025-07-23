import { Module } from '@nestjs/common';
import { CustomersModule } from 'src/customers/customers.module';
import { ZaloModule } from 'src/integration/zalo/zalo.module';
import { UsersModule } from 'src/users/users.module';
import { ChannelsModule } from '../channels/channels.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { MessagesModule } from '../messages/messages.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { FacebookModule } from 'src/integration/facebook/facebook.module';
import { AgentServiceModule } from 'src/integration/agent-service/agent-service.module';
import { AgentsModule } from 'src/agents/agents.module';
import { KafkaModule } from 'src/kafka/kafka.module';

@Module({
  imports: [
    ConversationsModule,
    MessagesModule,
    ChannelsModule,
    ZaloModule,
    FacebookModule,
    CustomersModule,
    UsersModule,
    AgentsModule,
    AgentServiceModule,
    KafkaModule,
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
