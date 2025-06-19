// DTOs for Permission operations
export class CreatePermissionDto {
  name: string;
  description?: string;
  code: string;
}

export class UpdatePermissionDto {
  name?: string;
  description?: string;
  code?: string;
}

export class PermissionResponseDto {
  id: number;
  name: string;
  description: string;
  code: string;
  rolesCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PermissionQueryParamsDto {
  name?: string;
  description?: string;
  code?: string;
}

export class PermissionPaginationQueryDto extends PermissionQueryParamsDto {
  page?: number = 1;
  limit?: number = 10;
  sortBy?: string = 'createdAt';
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class PaginatedPermissionsDto {
  data: PermissionResponseDto[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export class PermissionBulkDeleteDto {
  permissionIds: number[];
}
