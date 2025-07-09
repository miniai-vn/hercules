import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/gaurds/permission.guard';
import { UploadsService } from './uploads.service';
@Controller('uploads')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UploadsController {
  constructor(private readonly s3: UploadsService) {}

  @Get(':key')
  // @RequirePermissions(PermissionCode.DEPARTMENT_READ)
  async getFile(@Param('key') key: string) {
    const file = await this.s3.sendDataToElt(key);
    return {
      data: file,
      message: 'File retrieved successfully',
    };
  }
}
