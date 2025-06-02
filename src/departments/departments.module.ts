import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from './departments.entity';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller'; // Assuming you have this
@Module({
  imports: [
    TypeOrmModule.forFeature([Department]), // This line is crucial
  ],
  providers: [DepartmentsService],
  controllers: [DepartmentsController], // Add if you have a controller
  exports: [DepartmentsService], // Important if other modules need to inject DepartmentsService
})
export class DepartmentsModule {}
