import { forwardRef, Module } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { FacebookController } from './facebook.controller';
import { ChannelsModule } from 'src/channels/channels.module';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [ConfigModule, forwardRef(() => ChannelsModule)],
  providers: [FacebookService],
  controllers: [FacebookController],
  exports: [FacebookService],
})
export class FacebookModule {}
