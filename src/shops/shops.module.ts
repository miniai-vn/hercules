import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopsController } from './shops.controller';
import { Shop } from './shops.entity';
import { ShopService } from './shops.service';
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Shop])],
  providers: [ShopService],
  exports: [ShopService],
  controllers: [ShopsController],
})
export class ShopsModule {}
