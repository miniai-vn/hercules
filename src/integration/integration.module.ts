import { forwardRef, Module } from '@nestjs/common';
import { IntegrationService } from './integration.service';
import { IntegrationController } from './integration.controller';
import { ZaloModule } from './zalo/zalo.module';
import { ChannelsModule } from 'src/channels/channels.module';

@Module({
  imports: [ZaloModule],
  providers: [IntegrationService],
  controllers: [IntegrationController],
})
export class IntegrationModule {}
