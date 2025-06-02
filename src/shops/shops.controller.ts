import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth.module';
import { Shop } from './shops.entity';
import { ShopService } from './shops.service';

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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async findMyShop(@Request() req) {
    const shopId = req.user.shop_id;
    return {
      message: 'Shop found successfully',
      data: await this.shopService.findOne(shopId),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Shop | null> {
    return this.shopService.findOne(id);
  }

  @Put('/zalo-id')
  @UseGuards(JwtAuthGuard)
  async updateZaloId(
    @Request() req,
    @Body('zaloId') zaloId: string,
  ): Promise<Shop | null> {
    const id = req.user.shop_id; // or req.user.shopId, depending on your JWT payload
    return this.shopService.updateZaloId(id, zaloId);
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
}
