import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationMembersService } from './conversation-members.service';
import { ConversationMember } from './conversation-members.entity';
import { CustomersModule } from 'src/customers/customers.module';
import { UsersModule } from 'src/users/users.module';
import { MessagesModule } from 'src/messages/messages.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConversationMember]),
    forwardRef(() => CustomersModule),
    forwardRef(() => UsersModule), // Assuming UsersModule is also needed
    forwardRef(() => MessagesModule),
  ],
  providers: [ConversationMembersService],
  controllers: [],
  exports: [ConversationMembersService], // Export for use in other modules
})
export class ConversationMembersModule {}
