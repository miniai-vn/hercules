import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SendMessageData {
  @Type(() => String)
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @Type(() => String)
  @IsNotEmpty()
  content: string;

  @Type(() => String)
  @IsNotEmpty()
  userId: string;

  @Type(() => String)
  @IsOptional()
  messageType?: string;

  @Type(() => String)
  @IsNotEmpty()
  shopId: string;

  @IsString()
  @IsOptional()
  quoteMsgId?: string;
}
