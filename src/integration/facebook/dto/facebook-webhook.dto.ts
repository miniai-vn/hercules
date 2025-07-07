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
    attachments?: FacebookAttachmentDTO[];
  };

  @IsOptional()
  postback?: any;

  // Bổ sung trường read cho message_read event
  @IsOptional()
  read?: {
    watermark: number;
    seq: number;
  };

  @IsString()
  @IsOptional()
  time: string;
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

export class FacebookAttachmentPayloadDTO {
  @IsString()
  @IsOptional()
  url?: string;

  @IsOptional()
  sticker_id?: number; // sticker_id chỉ có khi là sticker
}

export class FacebookAttachmentDTO {
  @IsString()
  type: string; // image, audio, video, file, fallback

  @IsObject()
  payload: FacebookAttachmentPayloadDTO;
}
