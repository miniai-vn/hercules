import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { Channel } from './channels.entity';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  async create(@Body() data: Partial<Channel>): Promise<Channel> {
    return this.channelsService.create(data);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<Channel>,
  ): Promise<Channel> {
    return this.channelsService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.channelsService.delete(id);
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number): Promise<Channel> {
    return this.channelsService.getOne(id);
  }

  @Get()
  async getAll(
    @Query('departmentId') departmentId?: number,
  ): Promise<Channel[]> {
    if (departmentId) {
      return this.channelsService.getByDepartmentId(Number(departmentId));
    }
    return this.channelsService.getAll();
  }
}
