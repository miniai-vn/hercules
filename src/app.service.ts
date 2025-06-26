// app.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaConsumerService } from './kafka/kafka.consumer';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly kafkaService: KafkaConsumerService) {}

  async onModuleInit() {
    await this.kafkaService.start();
  }
}
