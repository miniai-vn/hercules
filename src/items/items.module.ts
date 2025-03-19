import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from './entities/item';
import { Skus } from './entities/sku';

@Module({
  imports: [TypeOrmModule.forFeature([Item, Skus])],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
