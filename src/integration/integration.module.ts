import { Module } from '@nestjs/common';
import { FacebookModule } from './facebook/facebook.module';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';
import { ZaloModule } from './zalo/zalo.module';

@Module({
  imports: [ZaloModule, FacebookModule],
  providers: [IntegrationService],
  controllers: [IntegrationController],
})
export class IntegrationModule {}
