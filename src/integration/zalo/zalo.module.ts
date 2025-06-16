import { forwardRef, Module } from '@nestjs/common';
import { ZaloService } from './zalo.service';
import { ZaloController } from './zalo.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ChannelsModule } from 'src/channels/channels.module';
import { KafkaModule } from 'src/kafka/kafka.module';
import { ZaloSyncService } from './zalo-sync.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    forwardRef(() => ChannelsModule),
    KafkaModule,
  ],
  providers: [ZaloService, ZaloSyncService],
  controllers: [ZaloController],
  exports: [ZaloService, ZaloSyncService],
})
export class ZaloModule {}
