import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shop } from './entities/shop';
import { ShopService } from './shops.service';

@Module({
  imports: [TypeOrmModule.forFeature([Shop])],
  providers: [ShopService],
  exports: [ShopService],
})
export class ShopsModule {}
