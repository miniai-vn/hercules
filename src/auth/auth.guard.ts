import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ShopsModule } from 'src/shops/shops.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes config available globally
      envFilePath: '.env', // Path to your .env file
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60s' },
    }),
    ShopsModule, // Importing ShopsModule for shop-related functionalities
    
  ],
})
export class AuthModule {}
