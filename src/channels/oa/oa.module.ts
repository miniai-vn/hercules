import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config'; // Import ConfigModule
import { OAService } from './oa.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: () => ({
        timeout: 5000,
        maxRedirects: 5,
      }),
    }),
  ],
  providers: [OAService], // <-- OAService is provided here
  exports: [OAService], // <-- OAService is EXPORTED here, making it available to other modules
})
export class OAModule {}
