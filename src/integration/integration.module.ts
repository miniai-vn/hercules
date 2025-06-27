import { Module } from '@nestjs/common';
import { FacebookModule } from './facebook/facebook.module';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';
import { LazadaModule } from './lazada/lazada.module';
import { ZaloModule } from './zalo/zalo.module';

@Module({
  imports: [ZaloModule, FacebookModule, LazadaModule],
  providers: [IntegrationService],
  controllers: [IntegrationController],
})
export class IntegrationModule {}
