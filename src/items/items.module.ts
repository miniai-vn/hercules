import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from './items.entity';
import { Skus } from './sku.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Item, Skus])],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
