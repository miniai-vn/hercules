import { Type } from 'class-transformer';
import {
  ValidateNested,
  IsString,
  IsOptional,
  IsArray,
  IsObject,
} from 'class-validator';

export class FacebookMessagingEventDTO {
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
}

export class FacebookMessageEntryDTO {
  @IsString()
  id: string;

  @IsOptional()
  time?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FacebookMessagingEventDTO)
  messaging: FacebookMessagingEventDTO[];
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
