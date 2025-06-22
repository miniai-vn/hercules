import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatedResult } from 'src/common/types/reponse.type';
import { FindManyOptions, ILike, In, Repository } from 'typeorm';
import {
  CreatePermissionDto,
  PaginatedPermissionsDto,
  PermissionPaginationQueryDto,
  PermissionResponseDto,
  UpdatePermissionDto,
} from './dto/permissions.dto';
import { Permission } from './permissions.entity';

// Update the query DTO to extend the base pattern
export class PermissionQueryParamsDto {
  page?: number = 1;
  limit?: number = 10;
  search?: string;
  name?: string;
  description?: string;
  code?: string;
  sortBy?: string = 'createdAt';
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
  ) {}

  async getOne(id: number): Promise<Permission | null> {
    return this.permissionsRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
  }

  async findByIds(ids: number[]): Promise<Permission[]> {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return [];
    }

    return this.permissionsRepository.findBy({ id: In(ids) });
  }

  // Updated query method based on UsersService pattern
  async query(
    query: PermissionQueryParamsDto,
  ): Promise<PaginatedResult<Permission>> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        search,
        name,
        description,
        code,
      } = query;

      // Build where conditions using the same pattern as UsersService
      const whereConditions: any = {};

      // Global search functionality (searches across name, description, and code)
      if (search) {
        whereConditions.name = ILike(`%${search}%`);
        // Note: For multiple field search, you'd need to use query builder
        // This is simplified version searching only in name field
      }

      // Specific field filters
      if (name) {
        whereConditions.name = ILike(`%${name}%`);
      }

      if (description) {
        whereConditions.description = ILike(`%${description}%`);
      }

      if (code) {
        whereConditions.code = ILike(`%${code}%`);
      }

      const findOptions: FindManyOptions<Permission> = {
        where: whereConditions,
        relations: {
          roles: true, // Include roles relation
        },
        order: {
          [sortBy]: sortOrder.toUpperCase() as 'ASC' | 'DESC',
        },
        skip: (page - 1) * limit,
        take: limit,
      };

      const [permissions, total] =
        await this.permissionsRepository.findAndCount(findOptions);

      return {
        data: permissions,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
        total: total,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get permissions: ${error.message}`,
      );
    }
  }

  // Advanced search method similar to roles service
  async searchPermissions(
    searchTerm: string,
    query: PermissionQueryParamsDto = {},
  ): Promise<PaginatedResult<Permission>> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = query;

      const queryBuilder = this.permissionsRepository
        .createQueryBuilder('permission')
        .leftJoinAndSelect('permission.roles', 'roles');

      // Search across multiple fields
      queryBuilder.where(
        '(permission.name ILIKE :search OR permission.description ILIKE :search OR permission.code ILIKE :search)',
        { search: `%${searchTerm}%` },
      );

      // Add ordering
      queryBuilder.orderBy(
        `permission.${sortBy}`,
        sortOrder.toUpperCase() as 'ASC' | 'DESC',
      );

      // Add pagination
      queryBuilder.skip((page - 1) * limit).take(limit);

      const [permissions, total] = await queryBuilder.getManyAndCount();

      return {
        data: permissions,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
        total: total,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to search permissions: ${error.message}`,
      );
    }
  }

  // Add bulk operations like in UsersService
  async bulkDelete(permissionIds: number[]): Promise<{ deleted: number }> {
    try {
      if (
        !permissionIds ||
        !Array.isArray(permissionIds) ||
        permissionIds.length === 0
      ) {
        return { deleted: 0 };
      }

      const permissions = await this.permissionsRepository.find({
        where: { id: In(permissionIds) },
        relations: ['roles'],
      });

      // Check if any permission is assigned to roles
      const assignedPermissions = permissions.filter(
        (permission) => permission.roles && permission.roles.length > 0,
      );

      if (assignedPermissions.length > 0) {
        throw new BadRequestException(
          `Cannot delete permissions that are assigned to roles: ${assignedPermissions.map((p) => p.name).join(', ')}`,
        );
      }

      if (!permissions.length) {
        return { deleted: 0 };
      }

      await this.permissionsRepository.remove(permissions);
      return { deleted: permissions.length };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to bulk delete permissions: ${error.message}`,
      );
    }
  }

  // Add filter by assignment status
  async findByAssignmentStatus(
    isAssigned: boolean,
    query: PermissionQueryParamsDto = {},
  ): Promise<PaginatedResult<Permission>> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = query;

      const queryBuilder = this.permissionsRepository
        .createQueryBuilder('permission')
        .leftJoinAndSelect('permission.roles', 'roles');

      if (isAssigned) {
        queryBuilder.where('roles.id IS NOT NULL');
      } else {
        queryBuilder.where('roles.id IS NULL');
      }

      // Add ordering
      queryBuilder.orderBy(
        `permission.${sortBy}`,
        sortOrder.toUpperCase() as 'ASC' | 'DESC',
      );

      // Add pagination
      queryBuilder.skip((page - 1) * limit).take(limit);

      const [permissions, total] = await queryBuilder.getManyAndCount();

      return {
        data: permissions,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
        total: total,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get permissions by assignment status: ${error.message}`,
      );
    }
  }

  async findAll(
    query: PermissionPaginationQueryDto,
  ): Promise<PaginatedPermissionsDto> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        ...filters
      } = query;

      // Build where conditions
      const where: any = {};
      if (filters.name) where.name = ILike(`%${filters.name}%`);
      if (filters.description)
        where.description = ILike(`%${filters.description}%`);
      if (filters.code) where.code = ILike(`%${filters.code}%`);

      // Build order object
      const order: any = {};
      order[sortBy] = sortOrder;

      // Calculate skip value for pagination
      const skip = (page - 1) * limit;

      // Execute query with pagination
      const [permissions, totalItems] =
        await this.permissionsRepository.findAndCount({
          where,
          relations: ['roles'],
          order,
          skip,
          take: limit,
        });

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalItems / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        data: permissions.map((permission) => this.toResponseDto(permission)),
        currentPage: page,
        pageSize: limit,
        totalItems,
        totalPages,
        hasNextPage,
        hasPrevPage,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get permissions: ${error.message}`,
      );
    }
  }

  async findOne(id: number): Promise<PermissionResponseDto> {
    try {
      const permission = await this.permissionsRepository.findOne({
        where: { id },
        relations: ['roles'],
      });

      if (!permission) {
        throw new NotFoundException('Permission not found');
      }

      return this.toResponseDto(permission);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to get permission: ${error.message}`,
      );
    }
  }

  async create(
    createPermissionDto: CreatePermissionDto,
  ): Promise<PermissionResponseDto> {
    try {
      // Check if permission name already exists
      const existingPermissionByName = await this.permissionsRepository.findOne(
        {
          where: { name: createPermissionDto.name },
        },
      );
      if (existingPermissionByName) {
        throw new BadRequestException('Permission name already exists');
      }

      // Check if permission code already exists
      const existingPermissionByCode = await this.permissionsRepository.findOne(
        {
          where: { code: createPermissionDto.code },
        },
      );
      if (existingPermissionByCode) {
        throw new BadRequestException('Permission code already exists');
      }

      // Create permission
      const permission = this.permissionsRepository.create({
        ...createPermissionDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedPermission = await this.permissionsRepository.save(permission);
      return this.toResponseDto(savedPermission);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === '23505') {
        if (error.detail?.includes('name')) {
          throw new BadRequestException('Permission name already exists');
        }
        if (error.detail?.includes('code')) {
          throw new BadRequestException('Permission code already exists');
        }
        throw new BadRequestException('Permission name or code already exists');
      }
      throw new InternalServerErrorException(
        `Failed to create permission: ${error.message}`,
      );
    }
  }

  async update(
    id: number,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<PermissionResponseDto> {
    try {
      const permission = await this.permissionsRepository.findOne({
        where: { id },
        relations: ['roles'],
      });

      if (!permission) {
        throw new NotFoundException('Permission not found');
      }

      // Check if name already exists (if updating name)
      if (
        updatePermissionDto.name &&
        updatePermissionDto.name !== permission.name
      ) {
        const existingPermission = await this.permissionsRepository.findOne({
          where: { name: updatePermissionDto.name },
        });
        if (existingPermission) {
          throw new BadRequestException('Permission name already exists');
        }
      }

      // Check if code already exists (if updating code)
      if (
        updatePermissionDto.code &&
        updatePermissionDto.code !== permission.code
      ) {
        const existingPermission = await this.permissionsRepository.findOne({
          where: { code: updatePermissionDto.code },
        });
        if (existingPermission) {
          throw new BadRequestException('Permission code already exists');
        }
      }

      // Update permission fields
      Object.assign(permission, updatePermissionDto);
      permission.updatedAt = new Date();

      const savedPermission = await this.permissionsRepository.save(permission);
      return this.toResponseDto(savedPermission);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to update permission: ${error.message}`,
      );
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const permission = await this.permissionsRepository.findOne({
        where: { id },
        relations: ['roles'],
      });

      if (!permission) {
        throw new NotFoundException('Permission not found');
      }

      // Check if permission is assigned to any roles
      if (permission.roles && permission.roles.length > 0) {
        throw new BadRequestException(
          'Cannot delete permission that is assigned to roles',
        );
      }

      await this.permissionsRepository.remove(permission);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to remove permission: ${error.message}`,
      );
    }
  }

  async findByCode(code: string): Promise<Permission | null> {
    try {
      return await this.permissionsRepository.findOne({
        where: { code },
        relations: ['roles'],
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to find permission by code: ${error.message}`,
      );
    }
  }

  async getPermissionStats(): Promise<{
    totalPermissions: number;
    assignedPermissions: number;
    unassignedPermissions: number;
  }> {
    try {
      const permissions = await this.permissionsRepository.find({
        relations: ['roles'],
      });

      const totalPermissions = permissions.length;
      const assignedPermissions = permissions.filter(
        (permission) => permission.roles && permission.roles.length > 0,
      ).length;
      const unassignedPermissions = totalPermissions - assignedPermissions;

      return {
        totalPermissions,
        assignedPermissions,
        unassignedPermissions,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get permission stats: ${error.message}`,
      );
    }
  }

  private toResponseDto(permission: Permission): PermissionResponseDto {
    return {
      id: permission.id,
      name: permission.name,
      description: permission.description,
      code: permission.code,
      rolesCount: permission.roles?.length || 0,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    };
  }
}
