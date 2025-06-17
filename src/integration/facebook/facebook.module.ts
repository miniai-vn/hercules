import { forwardRef, Module } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { FacebookController } from './facebook.controller';
import { ChannelsModule } from 'src/channels/channels.module';
import { ConfigModule } from '@nestjs/config';
import { FacebookHttpService } from './facebook-http.service';
import { FacebookTokenService } from './facebook-token.service';
import { ScheduleModule } from '@nestjs/schedule';
@Module({
  imports: [
    ConfigModule,
    forwardRef(() => ChannelsModule),
    ScheduleModule.forRoot(),
  ],
  providers: [FacebookService, FacebookHttpService, FacebookTokenService],
  controllers: [FacebookController],
  exports: [FacebookService, FacebookTokenService],
})
export class FacebookModule {}
