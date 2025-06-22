import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt-auth.guard';
import {
  CreateRoleDto,
  RoleQueryParamsDto,
  UpdateRoleDto,
} from './dto/roles.dto';
import { RolesService } from './roles.service';

// @UseInterceptors(ResponseInterceptor)
@ApiTags('Roles')
@Controller('roles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all roles with pagination and filtering' })
  @ApiQuery({
    name: 'query',
    required: false,
    description: 'Page number',
    example: 1,
    type: RoleQueryParamsDto,
  })
  async query(@Req() req, @Query() queryParams: RoleQueryParamsDto) {
    try {
      return await this.rolesService.query({
        ...queryParams,
        shopId: queryParams.shopId ?? req.shop.id,
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve roles: ${error.message}`,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiParam({
    name: 'id',
    description: 'Role ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.rolesService.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to retrieve role: ${error.message}`,
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @ApiBody({
    type: CreateRoleDto,
    examples: {
      createRole: {
        summary: 'Create Role Example',
        description: 'Create a new role with permissions',
        value: {
          name: 'Manager',
          description: 'Management role with limited access',
          shopId: 'shop-123',
          permissionIds: ['perm-1', 'perm-2'],
          isActive: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Manager',
        description: 'Management role with limited access',
        isActive: true,
        isDefault: false,
        shopId: 'shop-123',
        createdAt: '2024-06-20T10:30:00.000Z',
        updatedAt: '2024-06-20T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 409,
    description: 'Role name already exists',
  })
  async create(@Req() req, @Body() createRoleDto: CreateRoleDto) {
    try {
      return await this.rolesService.create(
        createRoleDto.name,
        createRoleDto.description,
        req.shop,
        createRoleDto.permissionCodes || [],
      );
    } catch (error) {
      throw new BadRequestException(`Failed to create role: ${error.message}`);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update role by ID' })
  @ApiParam({
    name: 'id',
    description: 'Role ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: UpdateRoleDto,
    examples: {
      updateRole: {
        summary: 'Update Role Example',
        description: 'Update role information',
        value: {
          name: 'Senior Manager',
          description: 'Updated description',
          permissionIds: ['perm-1', 'perm-3'],
          isActive: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    try {
      return await this.rolesService.update(id, updateRoleDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update role: ${error.message}`);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete role by ID' })
  @ApiParam({
    name: 'id',
    description: 'Role ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Role deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  async delete(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.rolesService.delete(id);
      return { message: 'Role deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete role: ${error.message}`);
    }
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get role statistics' })
  @ApiQuery({
    name: 'shopId',
    required: false,
    description: 'Filter by shop ID',
    example: 'shop-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Role statistics retrieved successfully',
    schema: {
      example: {
        total: 10,
        active: 8,
        inactive: 2,
        default: 3,
        custom: 7,
        byShop: {
          'shop-123': 5,
          'shop-456': 5,
        },
      },
    },
  })
  async getStats(@Query('shopId') shopId?: string) {
    try {
      //   return await this.rolesService.getStats(shopId);
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve role statistics: ${error.message}`,
      );
    }
  }
}
