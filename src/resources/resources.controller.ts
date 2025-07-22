import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  ParseIntPipe,
  NotFoundException,
  HttpStatus,
  HttpCode,
  Patch,
  UploadedFile,
  UseInterceptors,
  Req,
  UseGuards,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ResourcesService } from './resources.service';
import { Resource } from './resources.entity';
import {
  CreateResourceDto,
  UpdateResourceDto,
  ResourceQueryDto,
  ResourceStatus,
} from './dto/resources.dto';
import { PaginatedResult } from 'src/common/types/reponse.type';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/gaurds/permission.guard';
import { PermissionCode } from 'src/common/enums/permission.enum';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';

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

  @Patch('/re-etl/:id')
  async reEtlResource(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Resource> {
    return await this.resourcesService.reEtlResource(id);
  }

  @ApiOperation({ summary: 'Get resources with pagination and filtering' })
  @Get('/search/ssss')
  async updateStatusByKey() {
    await this.resourcesService.updateStatusByKey(
      '3ad8770b-dd65-45fa-8b4a-f6feb58799e8/20/NQDphuc/NQCCONG-NỘI QUY CHẤM CÔNG-c398632e-b17d-48c5-b3d9-cd7b592c2907.docx',
      ResourceStatus.COMPLETED,
    );
    return {
      message: 'Resource status updated successfully',
    };
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
