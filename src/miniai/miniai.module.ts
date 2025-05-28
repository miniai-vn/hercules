import { Module } from '@nestjs/common';
import { CategoriesModule } from 'src/categories/categories.module';
import { ItemsModule } from 'src/items/items.module';
import { ShopsModule } from 'src/shops/shops.module';
import { MiniaiController } from './miniai.controller';
import { MiniaiService } from './miniai.service';

@Module({
  imports: [CategoriesModule, ItemsModule, ShopsModule],
  providers: [MiniaiService],
  exports: [MiniaiService],
  controllers: [MiniaiController],
})
export class MiniaiModule {}
