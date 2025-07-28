import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ChannelsModule } from './channels/channels.module';
import { OAModule } from './channels/oa/oa.module';
import { ChatGateway } from './chat/chat.gateway';
import { ChatModule } from './chat/chat.module';
import { ConversationMembersModule } from './conversation-members/conversation-members.module';
import { ConversationsModule } from './conversations/conversations.module';
import { CustomersModule } from './customers/customers.module';
import { getDatabaseConfig } from './database/database.config';
import { DepartmentsModule } from './departments/departments.module';
import { IntegrationModule } from './integration/integration.module';
import { ItemsModule } from './items/items.module';
import { KafkaModule } from './kafka/kafka.module';
import { MessagesModule } from './messages/messages.module';
import { MiniaiModule } from './miniai/miniai.module';
import { PermissionsModule } from './permissions/permissions.module';
import { ShopsModule } from './shops/shops.module';
import { TagsModule } from './tags/tags.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { UserDepartmentPermissionsModule } from './user-dept-perm/user-dept-perm.module';
import { ResourceModule } from './resources/resources.module';
import { UploadsModule } from './uploads/uploads.module';
import { getRedisConfig } from './configs/redis.config';
import { AgentsModule } from './agents/agents.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TemplatesModule } from './templates/templates.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        getRedisConfig(configService),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '.env.production'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        getDatabaseConfig(configService),
      inject: [ConfigService],
    }),
    RolesModule,
    ItemsModule,
    CategoriesModule,
    ShopsModule,
    MiniaiModule,
    ChannelsModule,
    DepartmentsModule,
    OAModule,
    ConversationsModule,
    MessagesModule,
    CustomersModule,
    UsersModule,
    ConversationMembersModule,
    TagsModule,
    ChatModule,
    IntegrationModule,
    AuthModule,
    KafkaModule,
    PermissionsModule,
    UserDepartmentPermissionsModule,
    ResourceModule,
    UploadsModule,
    AgentsModule,
    NotificationsModule,
    TemplatesModule,
  ],
  controllers: [AppController],
  providers: [AppService, ChatGateway],
})
export class AppModule {}
