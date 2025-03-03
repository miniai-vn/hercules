import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from './entities/item';

@Module({
  imports: [TypeOrmModule.forFeature([Item])],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
