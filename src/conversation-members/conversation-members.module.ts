import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesModule } from 'src/messages/messages.module';
import { ConversationMember } from './conversation-members.entity';
import { ConversationMembersService } from './conversation-members.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConversationMember]),
    forwardRef(() => MessagesModule),
  ],
  providers: [ConversationMembersService],
  controllers: [],
  exports: [ConversationMembersService], // Export for use in other modules
})
export class ConversationMembersModule {}
