import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationMembersService } from './conversation-members.service';
import { ConversationMember } from './conversation-members.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConversationMember])],
  providers: [ConversationMembersService],
  controllers: [],
  exports: [ConversationMembersService], // Export for use in other modules
})
export class ConversationMembersModule {}
