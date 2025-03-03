import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MiniappServiceService } from './miniapp-service/miniapp-service.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ItemsModule } from './items/items.module';
import { CategoriesService } from './categories/categories.service';
import { CategoriesModule } from './categories/categories.module';
import { ShopService } from './shop/shop.service';
import { ShopsService } from './shops/shops.service';
import { ShopsModule } from './shops/shops.module';
@Module({
  imports: [
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
      host: 'localhost',
      port: 5432,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [],
      synchronize: true,
    }),
    ItemsModule,
    CategoriesModule,
    ShopsModule,
  ],
  controllers: [AppController],
  providers: [AppService, MiniappServiceService, CategoriesService, ShopService, ShopsService],
})
export class AppModule {}
