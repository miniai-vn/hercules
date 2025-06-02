import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CategoriesModule } from './categories/categories.module';
import { ChannelsModule } from './channels/channels.module';
import { OAModule } from './channels/oa/oa.module';
import { getDatabaseConfig } from './database/database.config';
import { DepartmentsModule } from './departments/departments.module';
import { ItemsModule } from './items/items.module';
import { MiniaiModule } from './miniai/miniai.module';
import { ShopsModule } from './shops/shops.module';
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'redis-10293.c82.us-east-1-2.ec2.cloud.redislabs.com',
        port: 10293,
        password: '5mrFkt9Yc244lFqOR7pV4eYUBM7WsBPn',
      },
    }),
    BullModule.registerQueue({
      name: 'miniai-queue',
    }),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../', 'uploads'),
      serveRoot: '/uploads',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        getDatabaseConfig(configService),
      inject: [ConfigService],
    }),
    ItemsModule,
    CategoriesModule,
    ShopsModule,
    MiniaiModule,
    ChannelsModule,
    DepartmentsModule,
    OAModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
