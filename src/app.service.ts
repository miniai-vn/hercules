// app.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaConsumerService } from './kafka/kafka.consumer';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly kafkaService: KafkaConsumerService) {}

  async onModuleInit() {
    // await this.kafkaService.createConsumer(
    //   process.env.KAFKA_ZALO_MESSAGE_CONSUMER,
    //   process.env.KAFKA_ZALO_MESSAGE_TOPIC,
    //   async ({ message }) => {
    //     console.log('📦 Product:', message.value.toString());
    //   },
    // );
    await this.kafkaService.start();
  }
}
