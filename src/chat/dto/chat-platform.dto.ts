import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ChatPlatformDto {
  @ApiProperty({
    description: 'The ID of the conversation',
    example: '1234567890',
  })
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({
    description: 'The ID of the user sending the message',
    example: 'user_12345',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'The content of the message',
    example: 'Hello, this is a test message!',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'Optional type of the message (e.g., text, image, etc.)',
    example: 'text',
  })
  @IsOptional()
  @IsString()
  messageType?: string;
}
