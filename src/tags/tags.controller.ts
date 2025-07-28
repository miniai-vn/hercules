import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
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
import {
  CreateTagDto,
  TagBulkDeleteDto,
  TagQueryParamsDto,
  UpdateTagDto,
} from './dto/tag.dto';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt-auth.guard';

@ApiTags('Tags')
@Controller('tags')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tag' })
  @ApiBody({ type: CreateTagDto })
  @ApiResponse({
    status: 201,
    schema: { example: { message: 'Tag created successfully', data: {} } },
  })
  async create(@Req() req, @Body() createTagDto: CreateTagDto) {
    const tag = await this.tagsService.create({
      ...createTagDto,
      shopId: req.shop.id,
    });
    return { message: 'Tag created successfully', data: tag };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all tags (optionally filter by shopId or name)',
  })
  @ApiQuery({ name: 'shopId', required: false, type: String })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiResponse({
    status: 200,
    schema: { example: { message: 'Tags fetched successfully', data: [] } },
  })
  async findAll(@Req() req, @Query() query: TagQueryParamsDto) {
    const shopId = req.user.shopId; // Assuming shopId is stored in the user object
    const tags = await this.tagsService.findAll({
      ...query,
      shopId: query.shopId || shopId, // Use shopId from query or from user
    });
    return { message: 'Tags fetched successfully', data: tags };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tag by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    schema: { example: { message: 'Tag fetched successfully', data: {} } },
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const tag = await this.tagsService.findOne(id);
    return { message: 'Tag fetched successfully', data: tag };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update tag by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateTagDto })
  @ApiResponse({
    status: 200,
    schema: { example: { message: 'Tag updated successfully', data: {} } },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    const tag = await this.tagsService.update(id, updateTagDto);
    return { message: 'Tag updated successfully', data: tag };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete tag by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 204,
    schema: { example: { message: 'Tag deleted successfully', data: null } },
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.tagsService.remove(id);
    return { message: 'Tag deleted successfully', data: null };
  }

  @Delete()
  @ApiOperation({ summary: 'Bulk delete tags by IDs' })
  @ApiBody({ type: TagBulkDeleteDto })
  @ApiResponse({
    status: 200,
    schema: {
      example: { message: 'Tags deleted successfully', data: { deleted: 2 } },
    },
  })
  async bulkDelete(@Body() dto: TagBulkDeleteDto) {
    const result = await this.tagsService.bulkDelete(dto);
    return { message: 'Tags deleted successfully', data: result };
  }

  @Post('init-basic/:shopId')
  @ApiOperation({ summary: 'Initialize basic tags for a shop' })
  @ApiParam({ name: 'shopId', type: String })
  @ApiResponse({
    status: 201,
    schema: { example: { message: 'Basic tags initialized', data: [] } },
  })
  async initBasicTags(@Param('shopId') shopId: string) {
    const tags = await this.tagsService.initBasicTags(shopId);
    return { message: 'Basic tags initialized', data: tags };
  }
}
