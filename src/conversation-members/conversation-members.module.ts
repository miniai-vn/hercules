import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationMember } from './conversation-members.entity';
import { ConversationMembersService } from './conversation-members.service';

@Module({
  imports: [TypeOrmModule.forFeature([ConversationMember])],
  providers: [ConversationMembersService],
  controllers: [],
  exports: [ConversationMembersService],
})
export class ConversationMembersModule {}
