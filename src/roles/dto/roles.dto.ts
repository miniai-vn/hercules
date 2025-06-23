// DTOs for Role operations
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PermissionCode } from 'src/common/enums/permission.enum';

export class CreateRoleDto {
  @ApiProperty({ example: 'Manager' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Management role with limited access' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'shop-123' })
  @IsString()
  shopId: string;

  @ApiPropertyOptional({ example: ['permission-1', 'permission-2'] })
  @IsOptional()
  permissionCodes?: PermissionCode[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Senior Manager' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: ['permission-1', 'permission-3'] })
  @IsOptional()
  permissionIds?: number[];

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class RoleResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Admin' })
  name: string;

  @ApiProperty({ example: 'Administrator with full system access' })
  description: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: true })
  isDefault: boolean;

  @ApiProperty({ example: 'shop-123' })
  shopId: string;

  @ApiProperty({ example: '2024-06-20T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-06-20T10:30:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional()
  permissions?: any[];

  @ApiPropertyOptional()
  users?: any[];

  @ApiPropertyOptional()
  shop?: any;
}

export class RoleQueryParamsDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Search by role name or description',
    example: 'admin',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by shop ID',
    example: 'shop-123',
  })
  @IsOptional()
  @IsString()
  shopId?: string;

  @ApiPropertyOptional({
    description: 'Filter by role name',
    example: 'Admin',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by default status',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'createdAt',
    enum: ['name', 'createdAt', 'updatedAt'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class RolePaginationQueryDto extends RoleQueryParamsDto {
  page?: number = 1;
  limit?: number = 10;
  sortBy?: string = 'createdAt';
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
