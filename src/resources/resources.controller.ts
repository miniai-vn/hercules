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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ResourcesService } from './resources.service';
import { Resource } from './resources.entity';
import {
  CreateResourceDto,
  UpdateResourceDto,
  ResourceQueryDto,
} from './dto/resources.dto';
import { PaginatedResult } from 'src/common/types/reponse.type';

@ApiTags('resources')
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  @ApiOperation({ summary: 'Get resources with pagination and filtering' })
  async query(
    @Query() query: ResourceQueryDto,
  ): Promise<PaginatedResult<Resource>> {
    return this.resourcesService.query(query);
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
    const resource = await this.resourcesService.findOne(id);

    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }

    return resource;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createResourceDto: CreateResourceDto,
  ): Promise<Resource> {
    return this.resourcesService.create(createResourceDto);
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
  @ApiResponse({
    status: 404,
    description: 'Resource not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateResourceDto: UpdateResourceDto,
  ): Promise<Resource> {
    const resource = await this.resourcesService.update(id, updateResourceDto);

    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }

    return resource;
  }

  // Additional endpoints for common operations

  @Get('department/:departmentId')
  @ApiOperation({ summary: 'Get resources by department ID' })
  @ApiParam({
    name: 'departmentId',
    description: 'Department ID',
    type: 'number',
    example: 1,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Items per page',
    example: 20,
  })
  @Get('type/:type')
  @ApiOperation({ summary: 'Get resources by type' })
  @ApiParam({
    name: 'type',
    description: 'Resource type',
    type: 'string',
    example: 'document',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Items per page',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Resources by type retrieved successfully',
  })
  async getByType(
    @Param('type') type: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
  ): Promise<PaginatedResult<Resource>> {
    const query: ResourceQueryDto = {
      type,
      page,
      limit,
    };

    return this.resourcesService.query(query);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get resources by status' })
  @ApiParam({
    name: 'status',
    description: 'Resource status',
    type: 'string',
    example: 'completed',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Items per page',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Resources by status retrieved successfully',
  })
  async getByStatus(
    @Param('status') status: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
  ): Promise<PaginatedResult<Resource>> {
    const query: ResourceQueryDto = {
      status,
      page,
      limit,
    };

    return this.resourcesService.query(query);
  }
}
