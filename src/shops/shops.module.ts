import { Module } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shop } from './entities/shop';

@Module({
  imports: [TypeOrmModule.forFeature([Shop])],
  providers: [ShopsService],
  exports: [ShopsService],
})
export class ShopsModule {}
