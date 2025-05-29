import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shop } from './entities/shop';
import { ShopService } from './shops.service';
import { ShopsController } from './shops.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Shop])],
  providers: [ShopService],
  exports: [ShopService],
  controllers: [ShopsController],
})
export class ShopsModule {}
