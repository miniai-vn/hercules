import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RolesModule } from 'src/roles/roles.module';
import { ShopsModule } from 'src/shops/shops.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60s' },
    }),
    ShopsModule,
    RolesModule,
  ],
  providers: [],
  exports: [],
})
export class AuthModule {}
