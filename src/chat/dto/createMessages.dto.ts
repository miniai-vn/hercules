import { Optional } from '@nestjs/common';
import { IsInt, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsInt()
  id?: number;
  @IsString()
  senderType: string;

  @IsString()
  contentType: string;

  @IsString()
  content: string;

  @Optional()
  extraContent?: any;
}
