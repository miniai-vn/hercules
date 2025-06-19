import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Username or email',
    example: 'manager1@gmail.com',
    maxLength: 80,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  username: string;

  @ApiProperty({
    description: 'Password',
    example: 'SecurePassword123!',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(256)
  password: string;

  @ApiPropertyOptional({
    description: 'Platform type',
    example: 'web',
    maxLength: 80,
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  platform?: string;
}
