import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { MaterialItemsService } from './material-items.service';
import { AuthGuard } from 'src/auth/auth.guard';
@Controller('material-items')
export class MaterialItemsController {
  constructor(private readonly materialItemsService: MaterialItemsService) {}

  @UseGuards(AuthGuard)
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
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const user = req['user'];
    const typeOfFile = file.mimetype.split('/')[1];
    const name = file.originalname.split('.')[0];
    const newFileId = await this.materialItemsService.createFileMaterial({
      name: name,
      size: Math.floor(file.size / 1024) + ' KB',
      type: typeOfFile,
      path: file.filename,
      user,
    });

    return {
      message: 'File uploaded successfully',
      data: {
        id: newFileId,
      },
    };
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  async getAll(@Query() query: { type: string }) {
    return await this.materialItemsService.getMaterialItems(
      query.type as string,
    );
  }

  // create
  // @HttpCode(HttpStatus.OK)
  // @Post('/')
  // async createMeterials(@Body() input: any) {
  //   return await this.materialItemsService.createFileMaterial(input);
  // }

  // @HttpCode(HttpStatus.OK)
  // @Patch('/:id/sync')
  // syncMaterialItem(@Param('id') id: number) {
  //   return this.materialItemsService.syncMaterialItem(id);
  // }

  @HttpCode(HttpStatus.OK)
  @Delete('/:id')
  deleteMaterialItem(@Param('id') id: number) {
    return this.materialItemsService.deleteMaterialItem(id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/:id/chunks')
  async getChunks(@Param('id') id: number) {
    return {
      message: 'Get chunks successfully',
      data: await this.materialItemsService.getChunksByMaterialItemId(id),
    };
  }
}
