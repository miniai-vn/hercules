import { Module } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shops } from './entities/shop';

@Module({
  imports: [TypeOrmModule.forFeature([Shops])],
  providers: [ShopsService],
  exports: [ShopsService],
})
export class ShopsModule {}
