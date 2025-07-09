import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Producer } from 'kafkajs';
import { KafkaConfigService } from './kafka.config';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private producer: Producer;

  constructor(private readonly kafkaConfig: KafkaConfigService) {
    this.producer = this.kafkaConfig.createProducer();
  }

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

  async sendMessage(topic: string, message: any, key?: string) {
    try {
      await this.producer.send({
        topic,
        messages: [{
          key,
          value: JSON.stringify(message),
        }],
      });
    } catch (error) {
      console.error(`[Kafka] Failed to send message to topic ${topic}:`, error);
      throw error;
    }
  }
}
