import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { CreateOrUpdateMaterialItemDto } from './dto/createOrUpdateMaterialItem.dto';
import { MaterialItemsService } from './material-items.service';
@Controller('material-items')
export class MaterialItemsController {
  constructor(private readonly materialItemsService: MaterialItemsService) {}
  @Post('/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return {
      message: 'File uploaded successfully',
      data: {
        file: join(__dirname, '../../', 'uploads', file.filename),
      },
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  getAll() {
    return this.materialItemsService.getMaterialItems();
  }

  // create
  @HttpCode(HttpStatus.OK)
  @Post('/')
  async createMeterials(@Body() input: CreateOrUpdateMaterialItemDto) {
    return await this.materialItemsService.createMaterialItem(input);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('/:id/sync')
  syncMaterialItem(@Param('id') id: number) {
    return this.materialItemsService.syncMaterialItem(id);
  }

  @HttpCode(HttpStatus.OK)
  @Delete('/:id')
  deleteMaterialItem(@Param('id') id: number) {
    return this.materialItemsService.deleteMaterialItem(id);
  }
}
