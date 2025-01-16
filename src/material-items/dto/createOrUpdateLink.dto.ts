import { IsInt, IsString } from 'class-validator';

export class CreateOrUpdateLinkDto {
  @IsInt()
  id?: number;

  @IsString()
  link: string;
}
