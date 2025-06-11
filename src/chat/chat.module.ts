import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ConversationsModule } from '../conversations/conversations.module';
import { MessagesModule } from '../messages/messages.module';
import { ChannelsModule } from '../channels/channels.module';

@Module({
  imports: [ConversationsModule, MessagesModule, ChannelsModule],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
  exports: [],
})
export class ChatModule {}
