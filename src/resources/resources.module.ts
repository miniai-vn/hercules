import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatModule } from 'src/chat/chat.module';
import { AgentServiceModule } from 'src/integration/agent-service/agent-service.module';
import { KafkaModule } from 'src/kafka/kafka.module';
import { UploadsModule } from 'src/uploads/uploads.module';
import { ResourcesController } from './resources.controller';
import { Resource } from './resources.entity';
import { ResourcesService } from './resources.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Resource]),
    forwardRef(() => KafkaModule),
    AgentServiceModule,
    forwardRef(() => ChatModule),
    forwardRef(() => UploadsModule),
  ],
  controllers: [ResourcesController],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourceModule {}
