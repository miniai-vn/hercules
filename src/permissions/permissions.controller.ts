import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  PermissionQueryParamsDto,
  PermissionsService,
} from './permissions.service';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt-auth.guard';

@Controller('permissions')
@ApiTags('Permissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all permissions with pagination and filtering',
  })
  @ApiQuery({
    name: 'data',
    required: false,
    description: 'Page number',
    example: 1,
    type: PermissionQueryParamsDto,
  })
  async query(@Query() queryParams: PermissionQueryParamsDto) {
    return await this.permissionsService.query(queryParams);
  }
}
