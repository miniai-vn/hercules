import { forwardRef, Module } from '@nestjs/common';
import { ChatModule } from 'src/chat/chat.module';
import { ResourceModule } from 'src/resources/resources.module';
import { KafkaConfigService } from './kafka.config';
import { KafkaConsumerService } from './kafka.consumer';
import { KafkaProducerService } from './kafka.producer';

@Module({
  imports: [forwardRef(() => ChatModule), forwardRef(() => ResourceModule)],
  providers: [KafkaConsumerService, KafkaProducerService, KafkaConfigService],
  exports: [KafkaConsumerService, KafkaProducerService],
})
export class KafkaModule {}
