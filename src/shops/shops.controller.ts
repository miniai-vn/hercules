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
import { Shop } from './shops.entity';
import { ShopService } from './shops.service';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopService: ShopService) {}


  @Get()
  async findAll(): Promise<Shop[]> {
    return this.shopService.findAll();
  }

  @Get('me')
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

}
