import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/gaurds/permission.guard';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { PermissionCode } from 'src/common/enums/permission.enum';
@Controller('uploads')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UploadsController {
  constructor(private readonly s3: UploadsService) {}

  @Post('')
  @UseInterceptors(FileInterceptor('file'))
  @RequirePermissions(PermissionCode.DEPARTMENT_UPDATE)
  async upload(@Req() req, @UploadedFile() file: Express.Multer.File) {
    return {
      data: await this.s3.uploadFile(file, req.user.shopId),
      message: 'File uploaded successfully',
    };
  }

  @Get('presigned/:key')
  async presigned(@Param('key') key: string) {
    const url = await this.s3.getPresignedUrl(key);
    return { url };
  }
}
