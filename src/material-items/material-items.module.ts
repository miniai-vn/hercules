import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialItems } from './entity/material-item.entity';
import { MaterialItemsController } from './material-items.controller';
import { MaterialItemsService } from './material-items.service';

@Module({
  imports: [TypeOrmModule.forFeature([MaterialItems])],
  controllers: [MaterialItemsController],
  providers: [MaterialItemsService],
  exports: [MaterialItemsService, TypeOrmModule],
})
export class MaterialItemsModule {}
