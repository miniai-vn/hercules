// DTOs for Role operations
export class CreateRoleDto {
  name: string;
  description?: string;
  shopId: string;
  permissionIds?: number[];
}

export class UpdateRoleDto {
  name?: string;
  description?: string;
  permissionIds?: number[];
}

export class RoleResponseDto {
  id: number;
  name: string;
  description: string;
  shopId: string;
  permissions: { id: number; name: string; description: string }[];
  createdAt: Date;
  updatedAt: Date;
}

export class RoleQueryParamsDto {
  shopId?: string;
  name?: string;
  description?: string;
}

export class RolePaginationQueryDto extends RoleQueryParamsDto {
  page?: number = 1;
  limit?: number = 10;
  sortBy?: string = 'createdAt';
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class PaginatedRolesDto {
  data: RoleResponseDto[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export class RoleBulkDeleteDto {
  roleIds: number[];
}
