import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MeterialsService } from './materials.service';
import { CreateOrUpdateMaterialDto } from './dto/createMaterials.entity';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly meterialsService: MeterialsService) {}

  // api create meterials

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/')
  async createMeterials(
    @Req() request: Request,
    @Body() input: CreateOrUpdateMaterialDto,
  ) {
    const user = request['user'];
    return {
      message: 'Success',
      data: await this.meterialsService.createMeterials({
        ...input,
        user,
      }),
    };
  }

  // api get all meterials
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('/')
  async getAllMeterials(@Body() user: any) {
    return {
      message: 'Success',
      data: await this.meterialsService.findAll(),
    };
  }

  // api get meterial by id
  @HttpCode(HttpStatus.OK)
  @Post('get')
  async getMeterialById(@Body() id: number) {
    return await this.meterialsService.findOne(id);
  }

  @HttpCode(HttpStatus.OK)
  @Delete('/:id')
  async deleteMeterialById(@Param('id') id: number) {
    return await this.meterialsService.deleteMeterials(id);
  }
}
