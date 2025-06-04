import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from '../customers/customers.module';
import { MessagesModule } from '../messages/messages.module';
import { ConversationsController } from './conversations.controller';
import { Conversation } from './conversations.entity';
import { ConversationsService } from './conversations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation]),
    CustomersModule, // Import CustomersModule to use CustomersService
    forwardRef(() => MessagesModule), // Use forwardRef to handle circular dependency
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService], // Export service if other modules need it
})
export class ConversationsModule {}
