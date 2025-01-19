import { Module } from '@nestjs/common';
import { RagAgentService } from './rag-agent.service';

@Module({
  providers: [RagAgentService],
})
export class RagAgentModule {}
