import { IsInt, IsString } from 'class-validator';

export class CreateOrUpdateMaterialItemDto {
  @IsInt()
  materialId: number;

  @IsString()
  text?: string;

  @IsString()
  file?: string;

  @IsString()
  url?: string;
}
