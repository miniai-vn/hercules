import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VectorServiceModule } from 'src/vector-service/vector-service.module';
import { VectorServiceService } from 'src/vector-service/vector-service.service';
import { MaterialItems } from './entity/material-item.entity';
import { MaterialItemsController } from './material-items.controller';
import { MaterialItemsService } from './material-items.service';
import { LlmServiceModule } from 'src/llm-service/llm-service.module';
import { DataExtractionModule } from 'src/data-extraction/data-extraction.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MaterialItems]),
    VectorServiceModule,
    LlmServiceModule,
    DataExtractionModule,
  ],
  controllers: [MaterialItemsController],
  providers: [MaterialItemsService, VectorServiceService],
  exports: [MaterialItemsService, TypeOrmModule],
})
export class MaterialItemsModule {}
