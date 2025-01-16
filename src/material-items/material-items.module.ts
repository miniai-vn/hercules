import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChunksModule } from 'src/chunks/chunks.module';
import { MaterialItemsController } from './material-items.controller';
import { MaterialItemsService } from './material-items.service';
import { LinkMaterialItem } from './entity/link.entity';
import { FileMaterialItem } from './entity/file.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LinkMaterialItem, FileMaterialItem]),
    ChunksModule,
  ],
  controllers: [MaterialItemsController],
  providers: [MaterialItemsService],
  exports: [MaterialItemsService, TypeOrmModule],
})
export class MaterialItemsModule {}
