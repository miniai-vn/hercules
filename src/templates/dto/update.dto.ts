import { IsString } from 'class-validator';
import { TemplateDto } from './template.dto';

export class UpdateTemplateDto extends TemplateDto {
  @IsString()
  id: string;
  
}
