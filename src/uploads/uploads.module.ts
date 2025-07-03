import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { ResourceModule } from 'src/resources/resources.module';

@Module({
  imports: [ResourceModule],
  providers: [UploadsService],
  controllers: [UploadsController],
  exports: [UploadsService],
})
export class UploadsModule {}
