import { Module } from '@nestjs/common';
import { AgentServiceModule } from './agent-service/agent-service.module';
import { FacebookModule } from './facebook/facebook.module';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';
import { ZaloModule } from './zalo/zalo.module';

@Module({
  imports: [ZaloModule, FacebookModule, AgentServiceModule],
  providers: [IntegrationService],
  controllers: [IntegrationController],
})
export class IntegrationModule {}
