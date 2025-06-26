import { forwardRef, Module } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { FacebookController } from './facebook.controller';
import { ChannelsModule } from 'src/channels/channels.module';
import { FacebookHttpService } from './facebook-http.service';
import { FacebookTokenService } from './facebook-token.service';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [
    ChannelsModule,
    forwardRef(() => ChatModule),
    ScheduleModule.forRoot(),
    CacheModule.register({
      store: redisStore,
      host: 'redis-10293.c82.us-east-1-2.ec2.cloud.redislabs.com',
      port: 10293,
      password: '5mrFkt9Yc244lFqOR7pV4eYUBM7WsBPn',
      ttl: 60 * 60 * 24, // 24h
      // Không cần isGlobal
    }),
  ],
  providers: [FacebookService, FacebookHttpService, FacebookTokenService],
  controllers: [FacebookController],
  exports: [FacebookService, FacebookTokenService],
})
export class FacebookModule {}
