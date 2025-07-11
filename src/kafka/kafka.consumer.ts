// kafka.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Consumer, EachMessagePayload } from 'kafkajs';
import { ChatService } from 'src/chat/chat.service';
import { MessageType } from 'src/common/enums/message.enum';
import { FacebookAttachment } from 'src/integration/facebook/types/message.type';
import { ZALO_CONFIG } from 'src/integration/zalo/config/zalo.config';
import { UploadsService } from 'src/uploads/uploads.service';
import { KafkaConfigService } from './kafka.config';

@Injectable()
export class KafkaConsumerService implements OnModuleDestroy {
  private consumers: Consumer[] = [];

  constructor(
    private readonly kafkaConfig: KafkaConfigService,
    private readonly chatService: ChatService,
    private readonly uploadService: UploadsService,
  ) {}

  async createConsumer(
    groupId: string,
    topic: string,
    handler: (payload: EachMessagePayload) => Promise<void> | void,
  ) {
    const consumer = this.kafkaConfig.createConsumer(groupId);
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });

    await consumer.run({
      eachMessage: async (payload) => {
        await handler(payload);
      },
    });

    this.consumers.push(consumer);
    console.log(`[Kafka] Consumer connected to topic: ${topic}`);
  }

  async onModuleDestroy() {
    for (const consumer of this.consumers) {
      await consumer.disconnect();
    }
  }

  async start() {
    // Zalo message consumer
    await this.createConsumer(
      process.env.KAFKA_ZALO_MESSAGE_CONSUMER,
      process.env.KAFKA_ZALO_MESSAGE_TOPIC,
      async ({ message }) => {
        const data = JSON.parse(message.value?.toString() || '{}');

        switch (data.event_name) {
          case ZALO_CONFIG.WEBHOOK_EVENTS.USER_SEND_TEXT:
          case ZALO_CONFIG.WEBHOOK_EVENTS.USER_SEND_STICKER:
          case ZALO_CONFIG.WEBHOOK_EVENTS.USER_SEND_IMAGE:
            await this.chatService.sendMessagesZaloToPlatform(data);
            break;

          case ZALO_CONFIG.WEBHOOK_EVENTS.OA_SEND_TEXT:
            await this.chatService.handleOASendTextMessage(data);
            break;

          default:
            console.warn(`[Kafka] Unknown Zalo event: ${data.event_name}`);
        }
      },
    );

    // Facebook message consumer
    await this.createConsumer(
      process.env.KAFKA_FACEBOOK_MESSAGE_CONSUMER || 'facebook-message-group',
      process.env.KAFKA_FACEBOOK_MESSAGE_TOPIC || 'facebook-messages',
      async ({ message }) => {
        const data = JSON.parse(message.value.toString());
        const msg = data.message;

        if (msg?.text) {
          await this.chatService.handleMessageFaceBook(data);
          return;
        }
      },
    );

    // ETL consumer
    await this.createConsumer(
      process.env.KAFKA_ETL_CONSUMER,
      process.env.KAFKA_ETL_TOPIC,
      async ({ message }) => {
        const data = JSON.parse(message.value?.toString() || '{}');
        await this.uploadService.sendDataToElt(data.s3Key, data.code);
      },
    );
  }
}
