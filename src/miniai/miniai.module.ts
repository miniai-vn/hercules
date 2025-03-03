import { Module } from '@nestjs/common';
import { MiniaiService } from './miniai.service';
import { ItemsModule } from 'src/items/items.module';
import { CategoriesModule } from 'src/categories/categories.module';
import { ShopsModule } from 'src/shops/shops.module';

@Module({
  imports: [ItemsModule, CategoriesModule, ShopsModule],
  providers: [MiniaiService],
  exports: [MiniaiService],
})
export class MiniaiModule {}
``;
