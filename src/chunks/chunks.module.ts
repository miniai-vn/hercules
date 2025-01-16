import { Module } from '@nestjs/common';
import { ChunksService } from './chunks.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chunks } from './entity/chunks';

@Module({
  imports: [TypeOrmModule.forFeature([Chunks])],
  providers: [ChunksService],
  exports: [ChunksService],
})
export class ChunksModule {}
