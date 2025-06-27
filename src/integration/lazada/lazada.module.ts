import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ChannelsModule } from 'src/channels/channels.module';
import { ConversationsModule } from 'src/conversations/conversations.module';
import { CustomersModule } from 'src/customers/customers.module';
import { KafkaModule } from 'src/kafka/kafka.module';
import { LazadaController } from './lazada.controller';
import { LazadaService } from './lazada.service';
// import { LazadaSyncProcessor } from './processors/lazada-sync.processor';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    forwardRef(() => ChannelsModule),
    KafkaModule,
    CustomersModule,
    ConversationsModule,
    // BullModule.registerQueue({
    //   name: process.env.REDIS_LAZADA_SYNC_TOPIC,
    //   defaultJobOptions: {
    //     removeOnComplete: true,
    //     removeOnFail: true,
    //   },
    // }),
  ],
  providers: [LazadaService],
  controllers: [LazadaController],
  exports: [LazadaService],
})
export class LazadaModule {}
