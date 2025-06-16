import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationsModule } from 'src/conversations/conversations.module';
import { CustomersModule } from 'src/customers/customers.module';
import { UsersModule } from 'src/users/users.module';
import { DepartmentsModule } from '../departments/departments.module';
import { ChannelsController } from './channels.controller';
import { Channel } from './channels.entity';
import { ChannelsService } from './channels.service';
import { OAModule } from './oa/oa.module';

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
