import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './channels.entity';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { DepartmentsModule } from '../departments/departments.module';
import { OAModule } from './oa/oa.module';
import { ConversationsModule } from 'src/conversations/conversations.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Channel]),
    forwardRef(() => DepartmentsModule),
    forwardRef(() => ConversationsModule),
    forwardRef(() => UsersModule),
    OAModule,
  ],
  providers: [ChannelsService],
  controllers: [ChannelsController],
  exports: [ChannelsService],
})
export class ChannelsModule {}
