import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  IsUUID,
  IsArray,
  MinLength,
  MaxLength,
  Matches,
  IsNumber,
  IsEnum,
  Min,
  Max,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Username (unique)',
    example: 'john_doe',
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
    description: 'Email address (unique)',
    example: 'john@example.com',
    maxLength: 80,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(80)
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+84987654321',
    maxLength: 80,
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Full name',
    example: 'John Doe',
    maxLength: 80,
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
    maxLength: 256,
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  avatar?: string;

  @ApiProperty({
    description: 'Shop ID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsUUID()
  shopId: string;

  @ApiPropertyOptional({
    description: 'Array of department IDs',
    type: [String],
    example: ['dept-uuid-1', 'dept-uuid-2'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  departmentIds?: string[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  channelIds?: number[];

  @ApiProperty({
    description: 'roles of the user',
  })
  @IsArray()
  @IsNotEmpty()
  @IsNumber({}, { each: true })
  roleIds: number[];
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Username (unique)',
    example: 'john_doe_updated',
    maxLength: 80,
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  username?: string;
  @ApiProperty({
    description: 'roles of the user',
  })
  @IsArray()
  @IsNotEmpty()
  @IsNumber({}, { each: true })
  roleIds: number[];

  @ApiPropertyOptional({
    description: 'Password',
    example: 'NewSecurePassword123!',
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(256)
  password?: string;

  @ApiPropertyOptional({
    description: 'Email address (unique)',
    example: 'john.updated@example.com',
    maxLength: 80,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(80)
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+84987654322',
    maxLength: 80,
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Full name',
    example: 'John Doe Updated',
    maxLength: 80,
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({
    description: 'Avatar URL',
    example: 'https://example.com/new-avatar.jpg',
    maxLength: 256,
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Platform type',
    example: 'mobile',
    maxLength: 80,
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  platform?: string;

  @ApiPropertyOptional({
    description: 'Zalo ID',
    example: 'zalo789012',
    maxLength: 80,
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  zaloId?: string;

  @ApiPropertyOptional({
    description: 'Array of department IDs',
    type: [String],
    example: ['dept-uuid-3', 'dept-uuid-4'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  departmentIds?: string[];
}

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  id: string;

  @ApiProperty({
    description: 'Username',
    example: 'john_doe',
  })
  username: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john@example.com',
  })
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+84987654321',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Full name',
    example: 'John Doe',
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  avatar?: string;

  @ApiProperty({
    description: 'Shop ID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  shopId?: string;

  @ApiProperty({
    description: 'Created at',
    example: '2024-06-07T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated at',
    example: '2024-06-07T12:00:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Deleted at',
    example: '2024-06-07T12:00:00.000Z',
  })
  deletedAt?: Date;
}

export class UserQueryParamsDto {
  @ApiPropertyOptional({
    description: 'Shop ID to filter users',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsOptional()
  @IsUUID()
  shopId?: string;

  @ApiPropertyOptional({
    description: 'Search by username',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    description: 'Search by email',
    example: 'john@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Search by platform',
    example: 'web',
  })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({
    description: 'Search by name',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  name?: string;
}

export class UserBulkDeleteDto {
  @ApiProperty({
    description: 'Array of user IDs to delete',
    type: [String],
    example: ['user-uuid-1', 'user-uuid-2'],
  })
  @IsArray()
  @IsNotEmpty({ each: true })
  @IsUUID('4', { each: true })
  userIds: string[];
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'CurrentPassword123!',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewPassword123!',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(256)
  newPassword: string;
}

// Add pagination DTOs
export class PaginatedUsersDto {
  @ApiProperty({ type: [UserResponseDto] })
  data: UserResponseDto[];

  @ApiProperty({ example: 1 })
  currentPage: number;

  @ApiProperty({ example: 10 })
  pageSize: number;

  @ApiProperty({ example: 100 })
  totalItems: number;

  @ApiProperty({ example: 10 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPrevPage: boolean;
}

export class UserPaginationQueryDto extends UserQueryParamsDto {
  @ApiPropertyOptional({
    description: 'Page number (starts from 1)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
