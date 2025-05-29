import { Controller, Put, Body } from '@nestjs/common';

@Controller('miniai')
export class MiniaiController {
  @Put('sync-product')
  async update(): Promise<{ message: string }> {
    // Call your sync logic here
    return { message: 'Product sync triggered' };
  }
}
