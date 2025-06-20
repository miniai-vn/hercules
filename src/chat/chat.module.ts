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

@Module({
  imports: [
    ConversationsModule,
    MessagesModule,
    ChannelsModule,
    ZaloModule,
    CustomersModule,
    UsersModule,
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
  exports: [],
})
export class ChatModule {}
