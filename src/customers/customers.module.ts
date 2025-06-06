import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { Customer } from './customers.entity';
import { ShopsModule } from '../shops/shops.module';
import { ChannelsModule } from 'src/channels/channels.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer]), 
    forwardRef(() => ShopsModule), 
    forwardRef(() => ChannelsModule), 
  ],
  providers: [CustomersService],
  controllers: [CustomersController],
  exports: [CustomersService], 
})
export class CustomersModule {}
