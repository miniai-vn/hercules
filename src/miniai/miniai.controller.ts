import { Controller, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { SyncDataShopDto } from './miniai.dto';
import { MiniaiService } from './miniai.service';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt-auth.guard';

@Controller('miniai')
export class MiniaiController {
  constructor(private readonly miniaiService: MiniaiService) {}

  @Patch('sync-shop')
  @UseGuards(JwtAuthGuard)
  async syncDataShop(@Request() req): Promise<{ message: string }> {
    const shopId = req.user.shopId; // or req.user.id, depending on your JWT payload
    await this.miniaiService.startSync(shopId);
    return { message: 'Shop data sync triggered' };
  }
}
