// kafka.service.ts
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Consumer, EachMessagePayload } from 'kafkajs';
import { ChatService } from 'src/chat/chat.service';
import { ZALO_CONFIG } from 'src/integration/zalo/config/zalo.config';
import { ResourcesService } from 'src/resources/resources.service';
import { KafkaConfigService } from './kafka.config';

@Injectable()
export class KafkaConsumerService implements OnModuleDestroy {
  private consumers: Consumer[] = [];
  private readonly logger = new Logger(KafkaConsumerService.name);

  constructor(
    private readonly kafkaConfig: KafkaConfigService,
    private readonly chatService: ChatService,
    private readonly resourceService: ResourcesService,
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
    const consumer = this.kafkaConfig.createConsumer(
      process.env.KAFKA_ZALO_MESSAGE_CONSUMER || 'zalo-message-group',
    );
    await consumer.connect();
    await consumer.subscribe({
      topics: [
        process.env.KAFKA_ZALO_MESSAGE_TOPIC,
        process.env.KAFKA_LLM_RESULT_TOPIC,
      ],
      fromBeginning: false,
    });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          switch (topic) {
            case process.env.KAFKA_ZALO_MESSAGE_TOPIC:
              const data = JSON.parse(message.value.toString());
              await this.handleZaloMessage(data);
              break;

            case process.env.KAFKA_LLM_RESULT_TOPIC:
              const llmData = JSON.parse(message.value.toString());
              await this.handleLLMResult(llmData);
              break;

            default:
              this.logger.warn(`[Kafka] Unknown topic: ${topic}`);
          }
        } catch (error) {
          this.logger.error(
            `[Kafka] Zalo consumer error: ${error.message}`,
            error.stack,
          );
        }
      },
    });

    // Facebook message consumer
    await this.createConsumer(
      process.env.KAFKA_FACEBOOK_MESSAGE_CONSUMER || 'facebook-message-group',
      process.env.KAFKA_FACEBOOK_MESSAGE_TOPIC || 'facebook-messages',
      async ({ message }) => {
        try {
          const data = JSON.parse(message.value.toString());
          const msg = data.message;

          if (msg?.text) {
            await this.chatService.handleMessageFaceBook(data);
            return;
          }
        } catch (error) {
          this.logger.error(
            `[Kafka] Facebook consumer error: ${error.message}`,
            error.stack,
          );
        }
      },
    );

    // ETL consumer
    await this.createConsumer(
      process.env.KAFKA_ETL_CONSUMER,
      process.env.KAFKA_ETL_TOPIC,
      async ({ message }) => {
        try {
          const data = JSON.parse(message.value?.toString() || '{}');
          await this.resourceService.etl(
            data.s3Key,
            data.code,
            data.ext,
            data.tenantId,
            data.parentCode,
            data.fileName,
          );
        } catch (error) {
          this.logger.error(
            `[Kafka] ETL consumer error: ${error.message}`,
            error.stack,
          );
        }
      },
    );
  }

  async handleZaloMessage(payload) {
    switch (payload.event_name) {
      case ZALO_CONFIG.WEBHOOK_EVENTS.USER_SEND_TEXT:
      case ZALO_CONFIG.WEBHOOK_EVENTS.USER_SEND_STICKER:
      case ZALO_CONFIG.WEBHOOK_EVENTS.USER_SEND_IMAGE:
        await this.chatService.handleZaloMessage(payload);
        break;

      // case ZALO_CONFIG.WEBHOOK_EVENTS.OA_SEND_TEXT:
      //   await this.chatService.handleOAMessage(payload);
      //   break;

      default:
        this.logger.warn(`[Kafka] Unknown Zalo event: ${payload.event_name}`);
    }
  }

  async handleLLMResult(data) {
    try {
      switch (data.type) {
        // case ResultLLMType.ETL:
        //   await this.resourceService.updateResourceAfterETL(data);
        //   break;
        case 'text':
          await this.chatService.handleLLMTextResult(data);
          break;
        default:
          this.logger.warn(`[Kafka] Unknown LLM result type: ${data.type}`);
      }
    } catch (error) {
      this.logger.error(
        `[Kafka] LLM result handling error: ${error.message}`,
        error.stack,
      );
    }
  }
}
