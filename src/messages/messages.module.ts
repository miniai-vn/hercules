import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesController } from './messages.controller';
import { Message } from './messages.entity';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt-auth.guard';
import { ConversationsModule } from 'src/conversations/conversations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    forwardRef(() => ConversationsModule),
  ],
  controllers: [MessagesController],
  providers: [MessagesService, JwtAuthGuard],
  exports: [MessagesService],
})
export class MessagesModule {}
