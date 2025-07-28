import { Type } from 'class-transformer';
import { TemplateDto } from './template.dto';
import { IsOptional } from 'class-validator';

export class CreateTemplateDto extends TemplateDto {
  @Type(() => Number)
  @IsOptional()
  channelId?: number;

  @Type(() => String)
  @IsOptional()
  shopId?: string;
}
