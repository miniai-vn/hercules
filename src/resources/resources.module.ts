import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourcesController } from './resources.controller';
import { Resource } from './resources.entity';
import { ResourcesService } from './resources.service';
import { KafkaModule } from 'src/kafka/kafka.module';
import { AgentServiceModule } from 'src/integration/agent-service/agent-service.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Resource]),
    KafkaModule,
    AgentServiceModule,
  ],
  controllers: [ResourcesController],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourceModule {}
