import { Injectable } from '@nestjs/common';
import { Kafka, KafkaConfig, logLevel } from 'kafkajs';

@Injectable()
export class KafkaConfigService {
  private static instance: KafkaConfigService;
  private kafka: Kafka;

  constructor() {
    if (KafkaConfigService.instance) {
      return KafkaConfigService.instance;
    }

    this.kafka = new Kafka(this.getKafkaConfig());
    KafkaConfigService.instance = this;
  }

  private getKafkaConfig(): KafkaConfig {
    return {
      clientId: process.env.KAFKA_CLIENT_ID || 'hercules-client',
      brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      connectionTimeout: parseInt(process.env.KAFKA_CONNECTION_TIMEOUT) || 10000,
      requestTimeout: parseInt(process.env.KAFKA_REQUEST_TIMEOUT) || 30000,
      retry: {
        initialRetryTime: 300,
        retries: 10,
        maxRetryTime: 30000,
        factor: 0.2,
      },
      sasl: process.env.KAFKA_USER && process.env.KAFKA_PASSWORD ? {
        mechanism: 'plain',
        username: process.env.KAFKA_USER,
        password: process.env.KAFKA_PASSWORD,
      } : undefined,
      logLevel: logLevel.NOTHING,
    };
  }

  getKafkaInstance(): Kafka {
    return this.kafka;
  }

  createProducer(config?: any) {
    return this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
      ...config,
    });
  }

  createConsumer(groupId: string, config?: any) {
    return this.kafka.consumer({
      groupId,
      ...config,
    });
  }
}