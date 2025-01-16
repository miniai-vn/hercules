import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileMaterialItem } from 'src/material-items/entity/file.entity';
import { Repository } from 'typeorm';
import { CreateChunksDto } from './dto/createChunk.dto';
import { Chunks } from './entity/chunks';

@Injectable()
export class ChunksService {
  constructor(
    @InjectRepository(Chunks)
    private readonly chunksRepository: Repository<Chunks>,
  ) {}

  async createManyChunks(input: CreateChunksDto[]) {
    console.log(input);

    const chunks = this.chunksRepository.create(
      input.map((i) => {
        return {
          text: i.text,
          file: i.file,
        };
      }),
    );

    const res = await this.chunksRepository.save(chunks);
    const ids = res.map((r) => r.id);
    return ids;
  }

  async getChunkByFileMaterialId(file: FileMaterialItem) {
    const chunks = await this.chunksRepository.find({
      where: {
        file: file,
      },
    });
    return chunks;
  }
}
