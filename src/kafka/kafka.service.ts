// kafka/kafka.service.ts
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class KafkaService implements OnModuleInit {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    try {
      // this.kafkaClient.subscribeToResponseOf(
      //   this.configService.get<string>('KAFKA_ZALO_MESSAGE_CONSUMER'),
      // );
      await this.kafkaClient.connect();
      console.log('✅ Kafka client connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect Kafka client:', error);
    }
  }

  emitMessage(topic: string, message: any) {
    return this.kafkaClient.emit(topic, message);
  }

  sendMessage(topic: string, message: any) {
    return this.kafkaClient.send(topic, message);
  }

  emitBatchMessages(topic: string, messages: any[]) {
    this.kafkaClient.emit(topic, messages);
  }
}
