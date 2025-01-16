import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Messages } from './entity/message';
import { SqlAgentModule } from 'src/sql-agent/sql-agent.module';

@Module({
  imports: [TypeOrmModule.forFeature([Messages]), SqlAgentModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
