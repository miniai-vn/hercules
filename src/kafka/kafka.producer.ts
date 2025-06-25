import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private kafka = new Kafka({
    clientId: 'kafka-app',
    brokers: ['103.42.59.43:29092'],
    connectionTimeout: 10000,
    requestTimeout: 30000,
    retry: {
      initialRetryTime: 300,
      retries: 10,
      maxRetryTime: 30000,
      factor: 0.2,
    },
  });
  private producer = this.kafka.producer({
    allowAutoTopicCreation: true,
    transactionTimeout: 30000,
  });

  async onModuleInit() {
    await this.producer.connect();
    console.log('[Kafka] Producer connected');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  getProducer() {
    return this.producer;
  }
}
