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
import { ItemsModule } from './items/items.module';
import { MiniaiModule } from './miniai/miniai.module';
import { MiniaiService } from './miniai/miniai.service';
import { Shops } from './shops/entities/shop';
import { ShopsModule } from './shops/shops.module';
import { Skus } from './items/entities/sku';
import { BullModule } from '@nestjs/bullmq';
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
      name: 'data-sync-queue',
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
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [Shops, Item, Category, Skus],
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
