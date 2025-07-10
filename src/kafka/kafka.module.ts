import { forwardRef, Module } from '@nestjs/common';
import { ChatModule } from 'src/chat/chat.module';
import { UploadsModule } from 'src/uploads/uploads.module';
import { KafkaConsumerService } from './kafka.consumer';
import { KafkaProducerService } from './kafka.producer';
import { KafkaConfigService } from './kafka.config';

@Module({
  imports: [forwardRef(() => ChatModule), forwardRef(() => UploadsModule)],
  providers: [KafkaConsumerService, KafkaProducerService, KafkaConfigService],
  exports: [KafkaConsumerService, KafkaProducerService],
})
export class KafkaModule {}
