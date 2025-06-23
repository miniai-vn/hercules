import { forwardRef, Module } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { FacebookController } from './facebook.controller';
import { ChannelsModule } from 'src/channels/channels.module';
import { ConfigModule } from '@nestjs/config';
import { FacebookHttpService } from './facebook-http.service';
import { FacebookTokenService } from './facebook-token.service';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from 'src/channels/channels.entity';
import { CustomersModule } from 'src/customers/customers.module';
import { ConversationsModule } from 'src/conversations/conversations.module';
import { ConversationMembersModule } from 'src/conversation-members/conversation-members.module';
import { MessagesModule } from 'src/messages/messages.module';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';

@Module({
  imports: [
    TypeOrmModule.forFeature([Channel]),
    ConfigModule,
    forwardRef(() => ChannelsModule),
    forwardRef(() => CustomersModule),
    forwardRef(() => ConversationsModule),
    forwardRef(() => ConversationMembersModule),
    forwardRef(() => MessagesModule),
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
