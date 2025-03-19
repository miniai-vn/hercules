import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { CategoriesModule } from 'src/categories/categories.module';
import { ItemsModule } from 'src/items/items.module';
import { ShopsModule } from 'src/shops/shops.module';
import { MiniaiConsumer } from './miniai.consumer';
import { MiniaiService } from './miniai.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'data-sync-queue',
      defaultJobOptions: {
        removeOnComplete: { age: 3600 }, // Xóa job sau 1 giờ
        removeOnFail: { age: 86400 }, // Xóa job thất bại sau 1 ngày
      },
    }),
    CategoriesModule,
    ItemsModule,
    ShopsModule,
  ],
  providers: [MiniaiService, MiniaiConsumer],
  exports: [MiniaiService],
})
export class MiniaiModule {}
