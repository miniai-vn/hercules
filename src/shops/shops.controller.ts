import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ShopService } from './shops.service';
import { Shop } from './entities/shop';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopService: ShopService) {}

  @Post()
  async create(@Body() data: Partial<Shop>): Promise<Shop> {
    return this.shopService.create(data);
  }

  @Get()
  async findAll(): Promise<Shop[]> {
    return this.shopService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Shop | null> {
    return this.shopService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Partial<Shop>,
  ): Promise<Shop | null> {
    return this.shopService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.shopService.remove(id);
  }

  @Get('zalo/:zaloId')
  async findByZaloId(@Param('zaloId') zaloId: string): Promise<Shop | null> {
    return this.shopService.findByZaloId(zaloId);
  }

  @Get('has/zalo')
  async findAllHavingZaloId(): Promise<Shop[]> {
    return this.shopService.findAllHavingZaloId();
  }

  @Put(':id/zalo')
  async updateZaloId(
    @Param('id') id: string,
    @Body('zaloId') zaloId: string,
  ): Promise<Shop | null> {
    return this.shopService.updateZaloId(id, zaloId);
  }
}
