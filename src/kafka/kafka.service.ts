// kafka/kafka.service.ts
import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class KafkaService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    try {
      this.kafkaClient.subscribeToResponseOf(
        this.configService.get<string>('KAFKA_ZALO_MESSAGE_CONSUMER'),
      );

      await this.kafkaClient.connect();
      console.log('✅ Kafka client connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect Kafka client:', error);
    }
  }

  sendMessage(topic: string, message: any) {
    return this.kafkaClient.emit(
      this.configService.get<string>('KAFKA_ZALO_MESSAGE_CONSUMER'),
      {
        app_id: '431280473888958120',
        user_id_by_app: '3106990734015032864',
        event_name: 'user_send_link',
        timestamp: '1749526513984',
        sender: {
          id: '5400804943472463766',
        },
        recipient: {
          id: '579745863508352884',
        },
        message: {
          msg_id: 'This is message id',
          text: 'This is testing message',
          attachments: [
            {
              type: 'link',
              payload: 'string',
            },
          ],
        },
      },
    );
  }
}
