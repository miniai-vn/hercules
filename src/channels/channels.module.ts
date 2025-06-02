import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './channels.entity';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { DepartmentsModule } from '../departments/departments.module';
import { OAModule } from './oa/oa.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Channel]),
    forwardRef(() => DepartmentsModule),
    OAModule, // <<<<------ OAModule MUST be imported here
  ],
  providers: [ChannelsService],
  controllers: [ChannelsController],
  // exports: [ChannelsService], // If other modules use ChannelsService
})
export class ChannelsModule {}
