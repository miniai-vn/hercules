import { Module } from '@nestjs/common';
import { AgentServiceService } from './agent-service.service';
import { AgentServiceController } from './agent-service.controller';

@Module({
  imports: [],
  controllers: [AgentServiceController],
  providers: [AgentServiceService],
  exports: [AgentServiceService],
})
export class AgentServiceModule {}
