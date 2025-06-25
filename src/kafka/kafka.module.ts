import { forwardRef, Module } from '@nestjs/common';
import { ChatModule } from 'src/chat/chat.module';
import { KafkaConsumerService } from './kafka.consumer';
import { KafkaProducerService } from './kafka.producer';

@Module({
  imports: [forwardRef(() => ChatModule)], // Use forwardRef if ChatModule imports KafkaModule to avoid circular dependency
  providers: [KafkaConsumerService, KafkaProducerService],
  exports: [KafkaConsumerService, KafkaProducerService], // Export the service if used in other modules
})
export class KafkaModule {}
