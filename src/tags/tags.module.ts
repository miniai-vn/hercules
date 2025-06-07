import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { Tag } from './tags.entity';
import { Shop } from '../shops/shops.entity';
import { ShopService } from '../shops/shops.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tag, Shop])],
  providers: [TagsService, ShopService],
  controllers: [TagsController],
  exports: [TagsService],
})
export class TagsModule {}
