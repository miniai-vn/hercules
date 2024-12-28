import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialItems } from './entity/material-item.entity';
import { MaterialItemsController } from './material-items.controller';
import { MaterialItemsService } from './material-items.service';
import { VectorServiceModule } from 'src/vector-service/vector-service.module';
import { VectorServiceService } from 'src/vector-service/vector-service.service';
import { DataExtractionService } from 'src/data-extraction/data-extraction.service';

@Module({
  imports: [TypeOrmModule.forFeature([MaterialItems]), VectorServiceModule],
  controllers: [MaterialItemsController],
  providers: [
    MaterialItemsService,
    VectorServiceService,
    DataExtractionService,
  ],
  exports: [MaterialItemsService, TypeOrmModule],
})
export class MaterialItemsModule {}
