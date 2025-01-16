import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { join } from 'path';
import { ChunksService } from 'src/chunks/chunks.service';
import { Like, Repository } from 'typeorm';
import { CreateOrUpdateFileDto } from './dto/createOrUpdateFile.dto';
import { FileMaterialItem } from './entity/file.entity';
import { link } from 'fs';

@Injectable()
export class MaterialItemsService {
  constructor(
    @InjectRepository(FileMaterialItem)
    private readonly fileMaterialItemsRepository: Repository<FileMaterialItem>,
    private readonly chunksService: ChunksService,
  ) {}

  /**
   * Create a new file material item
   * */

  async createFileMaterial(input: CreateOrUpdateFileDto) {
    try {
      const user = input.user;
      const prepareMaterialItem = await this.fileMaterialItemsRepository.create(
        {
          ...input,
          user,
          status: 'pending',
        },
      );
      const materialItem =
        await this.fileMaterialItemsRepository.save(prepareMaterialItem);
      const path =
        join(__dirname, '../../', 'uploads') + `\\${materialItem.path}`;

      const chunks = await axios.post(
        `${process.env.DATA_API_URL}/extraction/file-pdf`,
        {
          file_path: path,
        },
      );
      const newChunks = chunks.data.map((chunk) => ({
        text: chunk,
        file: materialItem,
      }));

      await this.chunksService.createManyChunks(newChunks);
      return materialItem.id;
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error creating material item',
      });
    }
  }

  async deleteMaterialItem(id: number): Promise<boolean> {
    const materialItem = await this.fileMaterialItemsRepository.findOne({
      where: { id },
    });
    if (!materialItem) {
      throw new Error('Material item not found');
    }
    await this.fileMaterialItemsRepository.delete(id);
    return true;
  }

  async getMaterialItems(type: string): Promise<any[]> {
    try {
      if (type === 'file') {
        return await this.fileMaterialItemsRepository.find({});
      }
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error getting material items',
      });
    }
  }

  async getChunksByMaterialItemId(id: number) {
    const link = await this.fileMaterialItemsRepository.findOne({
      where: { id },
    });
    const chunks = await this.chunksService.getChunkByFileMaterialId(link);
    return chunks || [];
  }
}
