import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaController } from './kafka.controller';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: configService.get<string>(
                'KAFKA_CLIENT_ID',
                'hercules-producer',
              ),
              brokers: [
                configService.get<string>(
                  'KAFKA_BROKERS',
                  '103.42.59.43:29092',
                ),
              ],
            },
            producer: {
              allowAutoTopicCreation: true,
              idempotent: false,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [KafkaService],
  controllers: [KafkaController],
  exports: [KafkaService], // Export the service if used in other modules
})
export class KafkaModule {}
