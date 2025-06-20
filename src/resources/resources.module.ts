import { Module } from '@nestjs/common';
import { ResourcesController } from './resources.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resource } from './resources.entity';
import { ResourcesService } from './resources.service';
import { DepartmentsModule } from 'src/departments/departments.module';

@Module({
  imports: [TypeOrmModule.forFeature([Resource]), DepartmentsModule],
  controllers: [ResourcesController],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourceModule {}
