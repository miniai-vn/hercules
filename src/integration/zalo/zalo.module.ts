import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChannelsModule } from 'src/channels/channels.module';
import { ConversationsModule } from 'src/conversations/conversations.module';
import { CustomersModule } from 'src/customers/customers.module';
import { KafkaModule } from 'src/kafka/kafka.module';
import { ZaloController } from './zalo.controller';
import { ZaloService } from './zalo.service';
import { BullModule } from '@nestjs/bullmq';
import { ZaloSyncProcessor } from './processors/zalo-sync.processor';
import { TagsModule } from 'src/tags/tags.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    forwardRef(() => ChannelsModule),
    KafkaModule,
    CustomersModule,
    ConversationsModule,
    TagsModule,
    BullModule.registerQueue({
      name: process.env.REDIS_ZALO_SYNC_TOPIC,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
    }),
  ],
  providers: [ZaloService, ZaloSyncProcessor],
  controllers: [ZaloController],
  exports: [ZaloService],
})
export class ZaloModule {}
