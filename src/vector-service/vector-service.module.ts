import { Module } from '@nestjs/common';
import { DataExtractionModule } from 'src/data-extraction/data-extraction.module';
import { LlmServiceModule } from 'src/llm-service/llm-service.module';
import { VectorServiceService } from './vector-service.service';
import { LlmServiceService } from 'src/llm-service/llm-service.service';
import { DataExtractionService } from 'src/data-extraction/data-extraction.service';

@Module({
  imports: [LlmServiceModule, DataExtractionModule],
  providers: [VectorServiceService, LlmServiceService, DataExtractionService],
  exports: [VectorServiceService],
})
export class VectorServiceModule {}
