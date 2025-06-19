import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RolesModule } from 'src/roles/roles.module';
import { ShopsModule } from 'src/shops/shops.module';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
    ShopsModule,
    RolesModule,
    UsersModule,
  ],
  providers: [AuthService],
  exports: [],
})
export class AuthModule {}
