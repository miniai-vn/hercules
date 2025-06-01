import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CategoriesModule } from './categories/categories.module';
import { Category } from './categories/categories.entity';
import { Channel } from './channels/channels.entity';
import { ChannelsModule } from './channels/channels.module';
import { Department } from './departments/departments.entity';
import { Item } from './items/entities/item';
import { Skus } from './items/entities/sku';
import { ItemsModule } from './items/items.module';
import { MiniaiModule } from './miniai/miniai.module';
import { MiniaiService } from './miniai/miniai.service';
import { Shop } from './shops/entities/shop';
import { ShopsModule } from './shops/shops.module';
import { AppDataSource } from './database/data-source';
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
    TypeOrmModule.forRoot({
      ...AppDataSource.options,
    }),
    ItemsModule,
    CategoriesModule,
    ShopsModule,
    MiniaiModule,
    ChannelsModule,
  ],
  controllers: [AppController],
  providers: [AppService, MiniaiService],
})
export class AppModule {}
