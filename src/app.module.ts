import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './auth/entity/users.entity';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { MeterialsService } from './meterials/materials.service';
import { MeterialsModule } from './meterials/materials.module';
import { MeterialItemsService } from './meterial-items/meterial-items.service';
import { Materials } from './meterials/entity/materials.entity';
import { MeterialItems } from './meterial-items/entity/meterial-item.entity';
import { MaterialsController } from './meterials/materials.controller';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'hgminh523',
      database: 'postgres',
      entities: [Users, Materials, MeterialItems],
      synchronize: true,
    }),
    AuthModule,
    MeterialsModule,
  ],
  controllers: [AppController, AuthController, MaterialsController],
  providers: [AppService, AuthService, MeterialsService, MeterialItemsService],
})
export class AppModule {}
