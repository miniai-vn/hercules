import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike } from 'typeorm';
import { Permission } from './permissions.entity';
import {
  CreatePermissionDto,
  PaginatedPermissionsDto,
  PermissionBulkDeleteDto,
  PermissionPaginationQueryDto,
  PermissionResponseDto,
  UpdatePermissionDto,
} from './dto/permissions.dto';

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

      // Check if permission name already exists (if updating name)
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

      // Check if permission code already exists (if updating code)
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

  async bulkDelete(dto: PermissionBulkDeleteDto): Promise<{ deleted: number }> {
    try {
      if (
        !dto.permissionIds ||
        !Array.isArray(dto.permissionIds) ||
        dto.permissionIds.length === 0
      ) {
        return { deleted: 0 };
      }

      const permissions = await this.permissionsRepository.find({
        where: { id: In(dto.permissionIds) },
        relations: ['roles'],
      });

      if (!permissions.length) {
        return { deleted: 0 };
      }

      // Check if any permissions are assigned to roles
      const permissionsWithRoles = permissions.filter(
        (permission) => permission.roles && permission.roles.length > 0,
      );
      if (permissionsWithRoles.length > 0) {
        throw new BadRequestException(
          'Cannot delete permissions that are assigned to roles',
        );
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

  async findByName(name: string): Promise<Permission | null> {
    try {
      return await this.permissionsRepository.findOne({
        where: { name },
        relations: ['roles'],
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to find permission by name: ${error.message}`,
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

  async findByRoleId(roleId: number): Promise<PermissionResponseDto[]> {
    try {
      const permissions = await this.permissionsRepository.find({
        where: {
          roles: {
            id: roleId,
          },
        },
        relations: ['roles'],
        order: { createdAt: 'DESC' },
      });

      return permissions.map((permission) => this.toResponseDto(permission));
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get permissions by role ID: ${error.message}`,
      );
    }
  }

  async findAvailablePermissions(): Promise<PermissionResponseDto[]> {
    try {
      const permissions = await this.permissionsRepository.find({
        relations: ['roles'],
        order: { name: 'ASC' },
      });

      return permissions.map((permission) => this.toResponseDto(permission));
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get available permissions: ${error.message}`,
      );
    }
  }

  async searchPermissions(
    searchTerm: string,
  ): Promise<PermissionResponseDto[]> {
    try {
      const permissions = await this.permissionsRepository.find({
        where: [
          { name: ILike(`%${searchTerm}%`) },
          { description: ILike(`%${searchTerm}%`) },
          { code: ILike(`%${searchTerm}%`) },
        ],
        relations: ['roles'],
        order: { name: 'ASC' },
      });

      return permissions.map((permission) => this.toResponseDto(permission));
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to search permissions: ${error.message}`,
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
