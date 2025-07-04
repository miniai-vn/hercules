import { Type } from 'class-transformer';
import {
  ValidateNested,
  IsString,
  IsOptional,
  IsArray,
  IsObject,
} from 'class-validator';

export class FacebookEventDTO {
  @IsObject()
  sender: { id: string };

  @IsObject()
  recipient: { id: string };

  @IsOptional()
  timestamp?: number;

  @IsOptional()
  message?: {
    mid?: string;
    text?: string;
  };

  @IsOptional()
  postback?: any;

  // Bổ sung trường read cho message_read event
  @IsOptional()
  read?: {
    watermark: number;
    seq: number;
  };
}

export class FacebookMessageEntryDTO {
  @IsString()
  id: string;

  @IsOptional()
  time?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FacebookEventDTO)
  messaging: FacebookEventDTO[];
}

export class FacebookWebhookDTO {
  @IsString()
  object: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FacebookMessageEntryDTO)
  entry?: FacebookMessageEntryDTO[];
}
