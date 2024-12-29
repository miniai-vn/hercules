import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataExtractionModule } from 'src/data-extraction/data-extraction.module';
import { LlmServiceModule } from 'src/llm-service/llm-service.module';
import { LlmServiceService } from 'src/llm-service/llm-service.service';
import { VectorServiceModule } from 'src/vector-service/vector-service.module';
import { VectorServiceService } from 'src/vector-service/vector-service.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Messages } from './entity/messages.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Messages]),
    VectorServiceModule,
    DataExtractionModule,
    LlmServiceModule,
  ],
  providers: [ChatService, VectorServiceService, LlmServiceService],
  controllers: [ChatController],
  exports: [ChatService, TypeOrmModule],
})
export class ChatModule {}
