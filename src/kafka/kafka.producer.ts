import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, logLevel } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID,
    brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
    connectionTimeout: 10000,
    requestTimeout: 30000,
    retry: {
      initialRetryTime: 300,
      retries: 10,
      maxRetryTime: 30000,
      factor: 0.2,
    },
    sasl: {
      mechanism: 'plain',
      username: process.env.KAFKA_USER,
      password: process.env.KAFKA_PASSWORD,
    },
    logLevel: logLevel.NOTHING,
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
