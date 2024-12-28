import { Module } from '@nestjs/common';
import { DataExtractionService } from './data-extraction.service';

@Module({
  providers: [DataExtractionService],
  exports: [DataExtractionService],
})
export class DataExtractionModule {}
