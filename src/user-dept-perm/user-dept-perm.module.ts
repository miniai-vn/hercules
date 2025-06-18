import { Module } from '@nestjs/common';
import { UserDepartmentPermissionsService } from './user-dept-perm.service';
import { UserDepartmentPermissionsController } from './user-dept-perm.controller';

@Module({
  providers: [UserDepartmentPermissionsService],
  controllers: [UserDepartmentPermissionsController]
})
export class UserDepartmentPermissionsModule {}
