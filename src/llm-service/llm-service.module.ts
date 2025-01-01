import { Module } from '@nestjs/common';
import { LlmServiceService } from './llm-service.service';

@Module({
  providers: [LlmServiceService],
  exports: [LlmServiceService],
})
export class LlmServiceModule {}
