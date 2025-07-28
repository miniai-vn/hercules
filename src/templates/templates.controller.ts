import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/gaurds/permission.guard';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { PermissionCode } from 'src/common/enums/permission.enum';
import { CreateTemplateDto } from './dto/create.dto';
import { QueryParamsDto } from './dto/query-params.dto';
import { UpdateTemplateDto } from './dto/update.dto';
import { TemplatesService } from './templates.service';

@Controller('templates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @RequirePermissions(PermissionCode.CHANNEL_READ)
  @Get()
  async query(@Query() query: QueryParamsDto) {
    return this.templatesService.query(query);
  }

  @RequirePermissions(PermissionCode.CHANNEL_CREATE)
  @Post()
  async create(@Req() req, @Body() data: CreateTemplateDto) {
    return this.templatesService.create({
      ...data,
      shopId: req.shop.id,
      channelId: data.channelId,
    });
  }

  @RequirePermissions(PermissionCode.CHANNEL_UPDATE)
  @Put(':id')
  async update(
    @Req() req,
    @Param('id') id: string,
    @Body() data: UpdateTemplateDto,
  ) {
    return this.templatesService.update({ ...data, id });
  }

  @RequirePermissions(PermissionCode.CHANNEL_DELETE)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.templatesService.delete(id);
  }
}
