// kafka.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Consumer, EachMessagePayload, Kafka } from 'kafkajs';
import { ChatService } from 'src/chat/chat.service';
import { UploadsService } from 'src/uploads/uploads.service';

@Injectable()
export class KafkaConsumerService implements OnModuleDestroy {
  private kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID,
    brokers: [process.env.KAFKA_BROKERS],
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
  });

  private consumers: Consumer[] = [];

  constructor(
    private readonly chatService: ChatService,
    private readonly uploadService: UploadsService,
  ) {}
  async createConsumer(
    groupId: string,
    topic: string,
    handler: (payload: EachMessagePayload) => Promise<void> | void,
  ) {
    const consumer = this.kafka.consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });

    await consumer.run({
      eachMessage: async (payload) => {
        await handler(payload);
      },
    });

    this.consumers.push(consumer);
  }

  async onModuleDestroy() {
    for (const consumer of this.consumers) {
      await consumer.disconnect();
    }
  }

  async start() {
    await this.createConsumer(
      process.env.KAFKA_ZALO_MESSAGE_CONSUMER,
      process.env.KAFKA_ZALO_MESSAGE_TOPIC,
      async ({ message }) => {
        const data = JSON.parse(message.value.toString());

        await this.chatService.sendMessagesZaloToPlatform(data);
      },
    );

    await this.createConsumer(
      process.env.KAFKA_FACEBOOK_MESSAGE_CONSUMER,
      process.env.KAFKA_FACEBOOK_MESSAGE_TOPIC,
      async ({ message }) => {
        const data = JSON.parse(message.value.toString());

        await this.chatService.sendMessagesFacebookToPlatform(data);
      },
    );

    await this.createConsumer(
      process.env.KAFKA_ETL_CONSUMER,
      process.env.KAFKA_ETL_TOPIC,
      async ({ message }) => {
        const data = JSON.parse(message.value.toString());
        await this.uploadService.sendDataToElt(data.s3Key, data.code);
      },
    );
  }
}
