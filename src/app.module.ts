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
import { Messages } from './chat/entity/message';
import { ChunksModule } from './chunks/chunks.module';
import { Chunks } from './chunks/entity/chunks';
import { ConversationsModule } from './conversations/conversations.module';
import { Conversation } from './conversations/entities/conversation.entity';
import { FileMaterialItem } from './material-items/entity/file.entity';
import { LinkMaterialItem } from './material-items/entity/link.entity';
import { MaterialItemsController } from './material-items/material-items.controller';
import { MaterialItemsModule } from './material-items/material-items.module';
import { MaterialItemsService } from './material-items/material-items.service';
import { Materials } from './materials/entity/materials.entity';
import { MaterialsController } from './materials/materials.controller';
import { MeterialsModule } from './materials/materials.module';
import { MeterialsService } from './materials/materials.service';
import { SqlAgentModule } from './sql-agent/sql-agent.module';
import { SqlAgentService } from './sql-agent/sql-agent.service';
import { ToolsModule } from './tools/tools.module';
@Module({
  imports: [
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
      entities: [
        Users,
        Materials,
        Conversation,
        Messages,
        Chunks,
        LinkMaterialItem,
        FileMaterialItem,
      ],
      synchronize: true,
    }),
    AuthModule,
    MeterialsModule,
    MaterialItemsModule,
    SqlAgentModule,
    ConversationsModule,
    ChunksModule,
    ChatModule,
    ToolsModule,
  ],
  controllers: [
    AppController,
    AuthController,
    MaterialsController,
    MaterialItemsController,
  ],
  providers: [
    AppService,
    AuthService,
    MeterialsService,
    MaterialItemsService,
    SqlAgentService,
  ],
})
export class AppModule {}
