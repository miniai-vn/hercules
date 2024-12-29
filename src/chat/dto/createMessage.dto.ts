import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  content: string;
  @IsOptional()
  @IsBoolean()
  isBot: boolean;
}
