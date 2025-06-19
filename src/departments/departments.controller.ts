import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { DepartmentPaginationQueryDto } from './dto/departments.dto';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/gaurds/permission.guard';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { PermissionCode } from 'src/common/enums/permission.enum';
import { NumericType } from 'typeorm';

@ApiTags('departments')
@Controller('departments')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @RequirePermissions(PermissionCode.DEPARTMENT_READ)
  @ApiOperation({ summary: 'Get departments with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Departments retrieved successfully',
  })
  async findAll(@Query() query: DepartmentPaginationQueryDto) {
    return this.departmentsService.query(query);
  }

  @Get('/:id')
  @RequirePermissions(PermissionCode.DEPARTMENT_READ)
  @ApiOperation({ summary: 'Get a department by ID' })
  @ApiResponse({
    status: 200,
    description: 'Department retrieved successfully',
  })
  async findOne(@Query('id') id: number) {
    return this.departmentsService.findOne(id);
  }
}
