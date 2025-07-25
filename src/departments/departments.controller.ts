import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/gaurds/permission.guard';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { PermissionCode } from 'src/common/enums/permission.enum';
import { DepartmentsService } from './departments.service';
import { DepartmentPaginationQueryDto } from './dto/departments.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';

@ApiTags('departments')
@Controller('departments')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @RequirePermissions(PermissionCode.DEPARTMENT_CREATE)
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({
    status: 201,
    description: 'Department created successfully',
  })
  async create(@Req() req, @Body() data: CreateDepartmentDto) {
    return this.departmentsService.create({
      ...data,
      shopId: req.shop.id,
    });
  }

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

  @Delete('/:id')
  @RequirePermissions(PermissionCode.DEPARTMENT_DELETE)
  @ApiOperation({ summary: 'Delete a department by ID' })
  @ApiResponse({
    status: 200,
    description: 'Department deleted successfully',
  })
  async delete(@Param('id') id: number) {
    return this.departmentsService.delete(id);
  }
}
