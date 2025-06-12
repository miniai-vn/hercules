import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shop } from './shops.entity';
import { ShopService } from './shops.service';
import { ShopsController } from './shops.controller';
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Shop])],
  providers: [ShopService],
  exports: [ShopService],
  controllers: [ShopsController],
})
export class ShopsModule {}
