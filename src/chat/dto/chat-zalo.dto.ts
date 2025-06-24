import { 
  IsString, 
  IsNumber, 
  IsObject, 
  ValidateNested, 
  IsArray, 
  IsOptional, 
  IsNotEmpty 
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ZaloSenderDto {
  @ApiProperty({
    description: 'Sender ID',
    example: '5400804943472463766'
  })
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class ZaloRecipientDto {
  @ApiProperty({
    description: 'Recipient ID', 
    example: '579745863508352884'
  })
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class ZaloLinkPayloadDto {
  @ApiProperty({
    description: 'URL to thumbnail image',
    example: 'url_to_thumbnail'
  })
  @IsString()
  @IsNotEmpty()
  thumbnail: string;

  @ApiProperty({
    description: 'Description of the link',
    example: 'description_of_link'
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'The actual link URL',
    example: 'link'
  })
  @IsString()
  @IsNotEmpty()
  url: string;
}

export class ZaloImagePayloadDto {
  @ApiPropertyOptional({
    description: 'Image URL',
    example: 'https://example.com/image.jpg'
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({
    description: 'Image thumbnail URL',
    example: 'https://example.com/thumbnail.jpg'
  })
  @IsOptional()
  @IsString()
  thumbnail?: string;
}

export class ZaloFilePayloadDto {
  @ApiPropertyOptional({
    description: 'File URL',
    example: 'https://example.com/file.pdf'
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({
    description: 'File name',
    example: 'document.pdf'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 1024
  })
  @IsOptional()
  @IsNumber()
  size?: number;
}

export class ZaloAttachmentDto {
  @ApiProperty({
    description: 'Type of attachment',
    example: 'link',
    enum: ['link', 'image', 'file', 'video', 'audio']
  })
  @IsString()
  @IsNotEmpty()
  type: 'link' | 'image' | 'file' | 'video' | 'audio';

  @ApiProperty({
    description: 'Attachment payload data',
    oneOf: [
      { $ref: '#/components/schemas/ZaloLinkPayloadDto' },
      { $ref: '#/components/schemas/ZaloImagePayloadDto' },
      { $ref: '#/components/schemas/ZaloFilePayloadDto' }
    ]
  })
  @IsObject()
  @ValidateNested()
  @Type(() => Object) // Will need custom validation based on type
  payload: ZaloLinkPayloadDto | ZaloImagePayloadDto | ZaloFilePayloadDto;
}

export class ZaloMessageDto {
  @ApiProperty({
    description: 'Message ID',
    example: 'This is message id'
  })
  @IsString()
  @IsNotEmpty()
  msg_id: string;

  @ApiPropertyOptional({
    description: 'Message text content',
    example: 'This is testing message'
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    description: 'Message attachments',
    type: [ZaloAttachmentDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ZaloAttachmentDto)
  attachments?: ZaloAttachmentDto[];
}

export class ZaloWebhookDto {
  @ApiProperty({
    description: 'Zalo App ID', 
    example: '431280473888958120'
  })
  @IsString()
  @IsNotEmpty()
  app_id: string;

  @ApiProperty({
    description: 'User ID by App',
    example: '3106990734015032864'
  })
  @IsString()
  @IsNotEmpty()
  user_id_by_app: string;

  @ApiProperty({
    description: 'Event name',
    example: 'user_send_link',
    enum: [
      'user_send_text',
      'user_send_image', 
      'user_send_link',
      'user_send_file',
      'user_send_audio',
      'user_send_video',
      'user_send_sticker'
    ]
  })
  @IsString()
  @IsNotEmpty()
  event_name: string;

  @ApiProperty({
    description: 'Event timestamp',
    example: '1749526513984'
  })
  @IsString()
  @IsNotEmpty()
  timestamp: string;

  @ApiProperty({
    description: 'Message sender information',
    type: ZaloSenderDto
  })
  @IsObject()
  @ValidateNested()
  @Type(() => ZaloSenderDto)
  sender: ZaloSenderDto;

  @ApiProperty({
    description: 'Message recipient information',
    type: ZaloRecipientDto
  })
  @IsObject()
  @ValidateNested()
  @Type(() => ZaloRecipientDto)
  recipient: ZaloRecipientDto;

  @ApiProperty({
    description: 'Message content and attachments',
    type: ZaloMessageDto
  })
  @IsObject()
  @ValidateNested()
  @Type(() => ZaloMessageDto)
  message: ZaloMessageDto;
}

// Additional DTOs for different event types
export class ZaloTextMessageDto extends ZaloWebhookDto {
  @ApiProperty({
    description: 'Event name for text messages',
    example: 'user_send_text'
  })
  event_name: 'user_send_text';
}

export class ZaloImageMessageDto extends ZaloWebhookDto {
  @ApiProperty({
    description: 'Event name for image messages',
    example: 'user_send_image'
  })
  event_name: 'user_send_image';
}

export class ZaloLinkMessageDto extends ZaloWebhookDto {
  @ApiProperty({
    description: 'Event name for link messages', 
    example: 'user_send_link'
  })
  event_name: 'user_send_link';
}

// Response DTOs
export class ZaloWebhookResponseDto {
  @ApiProperty({
    description: 'Response status',
    example: 'success'
  })
  @IsString()
  status: string;

  @ApiPropertyOptional({
    description: 'Response message',
    example: 'Message processed successfully'
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({
    description: 'Additional data',
    example: { conversationId: 123, messageId: 456 }
  })
  @IsOptional()
  @IsObject()
  data?: any;
}