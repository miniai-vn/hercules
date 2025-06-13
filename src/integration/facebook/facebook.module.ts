import { forwardRef, Module } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { FacebookController } from './facebook.controller';
import { HttpModule } from '@nestjs/axios';
import { ChannelsModule } from 'src/channels/channels.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule, forwardRef(() => ChannelsModule)],
  providers: [FacebookService],
  controllers: [FacebookController],
  exports: [FacebookService],
})
export class FacebookModule {}
