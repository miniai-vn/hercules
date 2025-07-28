import { Type } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class TemplateDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
