import { IsInt, IsString } from 'class-validator';
import { FileMaterialItem } from 'src/material-items/entity/file.entity';

export class CreateChunksDto {
  @IsInt()
  id?: number;

  @IsString()
  text: string;

  @IsInt()
  file?: FileMaterialItem;

  @IsInt()
  link?: number;
}
