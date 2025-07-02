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
  async create(@Body() createResourceDto: CreateResourceDto) {
    return {
      data: await this.resourcesService.create(createResourceDto),
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

  @Patch('/re-etl/:id')
  async reEtlResource(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Resource> {
    const resource = await this.resourcesService.reEtlResource(id);

    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }

    return resource;
  }
}
