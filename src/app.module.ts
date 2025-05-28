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
import { Category } from './categories/entities/category';
import { Item } from './items/entities/item';
import { Skus } from './items/entities/sku';
import { ItemsModule } from './items/items.module';
import { MiniaiModule } from './miniai/miniai.module';
import { MiniaiService } from './miniai/miniai.service';
import { Shop } from './shops/entities/shop';
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
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT, 5432) || 5432,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_NAME,
      entities: [Shop, Item, Category, Skus],
      synchronize: true,
    }),
    ItemsModule,
    CategoriesModule,
    ShopsModule,
    MiniaiModule,
  ],
  controllers: [AppController],
  providers: [AppService, MiniaiService],
})
export class AppModule {}
