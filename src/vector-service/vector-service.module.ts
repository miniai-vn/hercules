import { Module } from '@nestjs/common';
import { VectorServiceService } from './vector-service.service';
import { DataExtractionModule } from 'src/data-extraction/data-extraction.module';
import { DataExtractionService } from 'src/data-extraction/data-extraction.service';

@Module({
  imports: [DataExtractionModule],
  providers: [VectorServiceService, DataExtractionService],
  exports: [VectorServiceService],
})
export class VectorServiceModule {}
