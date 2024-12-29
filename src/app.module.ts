import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/auth.service';
import { Users } from './auth/entity/users.entity';
import { ChatModule } from './chat/chat.module';
import { DataExtractionModule } from './data-extraction/data-extraction.module';
import { LlmServiceModule } from './llm-service/llm-service.module';
import { MaterialItems } from './material-items/entity/material-item.entity';
import { MaterialItemsController } from './material-items/material-items.controller';
import { MaterialItemsModule } from './material-items/material-items.module';
import { MaterialItemsService } from './material-items/material-items.service';
import { Materials } from './materials/entity/materials.entity';
import { MaterialsController } from './materials/materials.controller';
import { MeterialsModule } from './materials/materials.module';
import { MeterialsService } from './materials/materials.service';
import { VectorServiceModule } from './vector-service/vector-service.module';
import { Messages } from './chat/entity/messages.entity';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'hgminh523',
      database: 'postgres',
      entities: [Users, Materials, MaterialItems, Messages],
      synchronize: true,
    }),
    AuthModule,
    MeterialsModule,
    MaterialItemsModule,
    VectorServiceModule,
    DataExtractionModule,
    ChatModule,
    LlmServiceModule,
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
