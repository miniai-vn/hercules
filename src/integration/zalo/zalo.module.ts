import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChannelsModule } from 'src/channels/channels.module';
import { CustomersModule } from 'src/customers/customers.module';
import { KafkaModule } from 'src/kafka/kafka.module';
import { ZaloController } from './zalo.controller';
import { ZaloService } from './zalo.service';
import { ConversationsModule } from 'src/conversations/conversations.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    forwardRef(() => ChannelsModule),
    KafkaModule,
    CustomersModule,
    ConversationsModule,
  ],
  providers: [ZaloService],
  controllers: [ZaloController],
  exports: [ZaloService],
})
export class ZaloModule {}
