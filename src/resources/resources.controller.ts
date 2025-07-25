import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/gaurds/permission.guard';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { PermissionCode } from 'src/common/enums/permission.enum';
import { PaginatedResult } from 'src/common/types/reponse.type';
import {
  CreateResourceDto,
  ResourceQueryDto,
  UpdateResourceDto
} from './dto/resources.dto';
import { Resource } from './resources.entity';
import { ResourcesService } from './resources.service';

@ApiTags('resources')
@Controller('resources')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  @ApiOperation({ summary: 'Get resources with pagination and filtering' })
  async query(
    @Query() query: ResourceQueryDto,
  ): Promise<PaginatedResult<Resource>> {
    return await this.resourcesService.query(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a resource by ID' })
  @ApiParam({
    name: 'id',
    description: 'Resource ID',
    type: 'number',
    example: 1,
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Resource> {
    return await this.resourcesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(PermissionCode.DEPARTMENT_CREATE)
  async create(
    @Req() req,
    @Body() createResourceDto: CreateResourceDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return {
      data: await this.resourcesService.create(file, {
        ...createResourceDto,
        shopId: req.shop.id,
      }),
      message: 'Resource created successfully',
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a resource' })
  @ApiParam({
    name: 'id',
    description: 'Resource ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Resource updated successfully',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateResourceDto: UpdateResourceDto,
  ) {
    return await this.resourcesService.update(id, updateResourceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a resource by ID' })
  @ApiParam({
    name: 'id',
    description: 'Resource ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Resource deleted successfully',
  })
  @RequirePermissions(PermissionCode.DEPARTMENT_DELETE)
  async delete(@Req() req, @Param('id', ParseIntPipe) id: number) {
    const result = await this.resourcesService.delete(id, req.shop.id);
    return {
      message: 'Resource deleted successfully',
      data: result,
    };
  }
}
