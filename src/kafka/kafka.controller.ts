import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { KafkaService } from './kafka.service';
@ApiTags('Kafka Testing')
@Controller('kafka')
export class KafkaController {
  constructor(private readonly kafkaService: KafkaService) {}

  @Get('test')
  async testKafka() {
    try {
      const message = { text: 'Hello from Kafka!' };
      await this.kafkaService.emitMessage('test-topic', message);
      return { status: 'success', message: 'Message sent to Kafka' };
    } catch (error) {
      console.error('Error sending message to Kafka:', error);
      return { status: 'error', message: 'Failed to send message to Kafka' };
    }
  }
}
