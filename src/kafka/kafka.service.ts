// kafka/kafka.service.ts
import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class KafkaService implements OnModuleInit {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    try {
      await this.kafkaClient.connect();
      console.log('✅ Kafka client connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect Kafka client:', error);
    }
  }

  sendMessage(topic: string, message: any) {
    return this.kafkaClient.emit(topic, message);
  }
}
