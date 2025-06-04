import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { Message } from './messages.entity';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]), // Register Message entity repository
    forwardRef(() => ConversationsModule), // Use forwardRef to handle circular dependency
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService], // Export service for other modules to use
})
export class MessagesModule {}
