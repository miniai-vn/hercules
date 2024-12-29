import { Module } from '@nestjs/common';
import { LlmServiceService } from './llm-service.service';

@Module({
  providers: [LlmServiceService]
})
export class LlmServiceModule {}
