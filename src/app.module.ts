import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './auth/entity/users.entity';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { Materials } from './materials/entity/materials.entity';
import { MaterialItems } from './material-items/entity/material-item.entity';
import { MeterialsModule } from './materials/materials.module';
import { MaterialsController } from './materials/materials.controller';
import { MeterialsService } from './materials/materials.service';
import { MaterialItemsController } from './material-items/material-items.controller';
import { MaterialItemsService } from './material-items/material-items.service';
import { MaterialItemsModule } from './material-items/material-items.module';
import { VectorServiceModule } from './vector-service/vector-service.module';
import { DataExtractionModule } from './data-extraction/data-extraction.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads', // Optional, default is root
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'hgminh523',
      database: 'postgres',
      entities: [Users, Materials, MaterialItems],
      synchronize: true,
    }),
    AuthModule,
    MeterialsModule,
    MaterialItemsModule,
    VectorServiceModule,
    DataExtractionModule,
  ],
  controllers: [
    AppController,
    AuthController,
    MaterialsController,
    MaterialItemsController,
  ],
  providers: [AppService, AuthService, MeterialsService, MaterialItemsService],
})
export class AppModule {}
