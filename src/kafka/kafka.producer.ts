import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private kafka = new Kafka({
    clientId: 'kafka-app',
    brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
    connectionTimeout: 10000,
    requestTimeout: 30000,
    retry: {
      initialRetryTime: 300,
      retries: 10,
      maxRetryTime: 30000,
      factor: 0.2,
    },
    ssl: false,
    sasl: {
      username: 'admin',
      password: 'admin-secret',
      mechanism: 'plain', // 'plain' or 'scram-sha-256'
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
