import { Module } from '@nestjs/common';
import { ZaloModule } from 'src/integration/zalo/zalo.module';
import { ChannelsModule } from '../channels/channels.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { MessagesModule } from '../messages/messages.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { CustomersModule } from 'src/customers/customers.module';

@Module({
  imports: [
    ConversationsModule,
    MessagesModule,
    ChannelsModule,
    ZaloModule,
    CustomersModule,
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
  exports: [],
})
export class ChatModule {}
