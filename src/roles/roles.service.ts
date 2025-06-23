import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PermissionCode } from 'src/common/enums/permission.enum';
import { PaginatedResult } from 'src/common/types/reponse.type';
import { Permission } from 'src/permissions/permissions.entity';
import { PermissionsService } from 'src/permissions/permissions.service';
import { Shop } from 'src/shops/shops.entity';
import { FindManyOptions, ILike, In, Repository } from 'typeorm';
import { RoleQueryParamsDto, UpdateRoleDto } from './dto/roles.dto';
import { Role } from './roles.entity';

export interface DefaultRole {
  name: string;
  description: string;
  permissions: PermissionCode[];
  isDefault: boolean;
  isActive: boolean;
}

export const DEFAULT_ROLES: Record<string, DefaultRole> = {
  admin: {
    name: 'Admin',
    description: 'Administrator with full system access',
    isDefault: true,
    isActive: true,
    permissions: [
      // Chat permissions
      PermissionCode.CHAT_READ,
      PermissionCode.CHAT_CREATE,
      PermissionCode.CHAT_UPDATE,
      PermissionCode.CHAT_DELETE,
      PermissionCode.CHAT_TRAIN,
      PermissionCode.CHAT_MANAGE_SETTINGS,

      // User permissions
      PermissionCode.USER_CREATE,
      PermissionCode.USER_READ,
      PermissionCode.USER_UPDATE,
      PermissionCode.USER_DELETE,
      PermissionCode.USER_BAN,
      PermissionCode.USER_ASSIGN_ROLE,

      // Role permissions
      PermissionCode.ROLE_CREATE,
      PermissionCode.ROLE_READ,
      PermissionCode.ROLE_UPDATE,
      PermissionCode.ROLE_DELETE,

      // Permission management
      PermissionCode.PERMISSION_ASSIGN,
      PermissionCode.PERMISSION_READ,

      // Settings
      PermissionCode.SETTING_READ,
      PermissionCode.SETTING_UPDATE,
      PermissionCode.SETTING_RESET,

      // Department
      PermissionCode.DEPARTMENT_CREATE,
      PermissionCode.DEPARTMENT_READ,
      PermissionCode.DEPARTMENT_UPDATE,
      PermissionCode.DEPARTMENT_DELETE,
      PermissionCode.DEPARTMENT_ASSIGN_USER,
      PermissionCode.DEPARTMENT_MANAGE_ROLES,

      // Conversation
      PermissionCode.CONVERSATION_CREATE,
      PermissionCode.CONVERSATION_READ,
      PermissionCode.CONVERSATION_UPDATE,
      PermissionCode.CONVERSATION_DELETE,

      // FAQ
      PermissionCode.FAQ_CREATE,
      PermissionCode.FAQ_READ,
      PermissionCode.FAQ_UPDATE,
      PermissionCode.FAQ_DELETE,

      // Domain
      PermissionCode.DOMAIN_CREATE,
      PermissionCode.DOMAIN_READ,
      PermissionCode.DOMAIN_UPDATE,
      PermissionCode.DOMAIN_DELETE,

      // Channel
      PermissionCode.CHANNEL_CREATE,
      PermissionCode.CHANNEL_READ,
      PermissionCode.CHANNEL_UPDATE,
      PermissionCode.CHANNEL_DELETE,
    ],
  },

  leader: {
    name: 'Leader',
    description: 'Team leader with departmental management access',
    isDefault: true,
    isActive: true,
    permissions: [
      // Chat permissions
      PermissionCode.CHAT_READ,
      PermissionCode.CHAT_CREATE,
      PermissionCode.CHAT_UPDATE,
      PermissionCode.CHAT_DELETE,
      PermissionCode.CHAT_TRAIN,

      // Department
      PermissionCode.DEPARTMENT_READ,
      PermissionCode.DEPARTMENT_ASSIGN_USER,

      // Conversation
      PermissionCode.CONVERSATION_READ,
      PermissionCode.CONVERSATION_CREATE,
      PermissionCode.CONVERSATION_UPDATE,

      // User permissions (limited)
      PermissionCode.USER_READ,
    ],
  },

  user: {
    name: 'User',
    description: 'Basic user with limited access',
    isDefault: true,
    isActive: true,
    permissions: [
      // File permissions - read only
      PermissionCode.FILE_READ,
      PermissionCode.FILE_DOWNLOAD,

      // Chat permissions - basic
      PermissionCode.CHAT_READ,
      PermissionCode.CHAT_CREATE,

      // Chunk permissions - read only
      PermissionCode.CHUNK_READ,

      // Basic conversation access
      PermissionCode.CONVERSATION_READ,

      // Basic FAQ access
      PermissionCode.FAQ_READ,
    ],
  },
};

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly permissionService: PermissionsService, // Assuming you have a PermissionService to handle permissions
  ) {}
  async create(
    name: string,
    description: string,
    shop: Shop,
    permissionCodes: PermissionCode[],
  ) {
    const newRole = this.roleRepository.create({
      name,
      description,
      shop: shop,
    });

    const permissionPromise = permissionCodes.map(
      async (code) => await this.permissionService.findByCode(code),
    );

    const permissions = await Promise.all(permissionPromise);
    try {
      return await this.roleRepository.save({
        ...newRole,
        permissions: permissions
          .filter((p) => !!p)
          .map((permission) => ({ id: permission.id })),
      });
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Role name already exists');
      }
      throw error;
    }
  }

  async update(id: number, data: UpdateRoleDto): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['shop', 'permissions'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    if (data.name) {
      role.name = data.name;
    }
    if (data.description) {
      role.description = data.description;
    }
    if (data.permissionIds && data.permissionIds.length > 0) {
      const permissions = await this.permissionService.findByIds(
        data.permissionIds,
      );
      role.permissions = permissions;
    }
    try {
      return await this.roleRepository.save(role);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to update role with ID ${id}: ${error.message}`,
      );
    }
  }

  async initRoleDefault(shop: Shop): Promise<boolean> {
    try {
      for (const key in DEFAULT_ROLES) {
        const roleData = DEFAULT_ROLES[key];

        await this.create(
          roleData.name,
          roleData.description,
          shop,
          roleData.permissions,
        );
      }
      return true;
    } catch (error) {
      throw new Error(`Failed to initialize default roles for shop`);
    }
  }

  // Get all roles
  async query(query: RoleQueryParamsDto): Promise<PaginatedResult<Role>> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        search,
        shopId,
        name,
        isActive,
        isDefault,
      } = query;

      // Build where conditions
      const whereConditions = {
        ...(search && {
          name: ILike(`%${search}%`),
        }),
        ...(shopId && { shop: { id: shopId } }),
        ...(name && { name: ILike(`%${name}%`) }),
        ...(isActive !== undefined && { isActive }),
        ...(isDefault !== undefined && { isDefault }),
      };

      const findOptions: FindManyOptions<Role> = {
        where: whereConditions,
        relations: {
          shop: true,
          permissions: true,
          users: true,
        },
        order: {
          [sortBy]: sortOrder.toUpperCase() as 'ASC' | 'DESC',
        },
        skip: (page - 1) * limit,
        take: limit,
      };

      const [roles, total] =
        await this.roleRepository.findAndCount(findOptions);

      return {
        data: roles,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
        total: total,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get roles: ${error.message}`,
      );
    }
  }

  // Update findOne method to use proper return type
  async findOne(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['shop', 'permissions', 'users'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async findByIds(ids: number[]): Promise<Role[]> {
    try {
      if (!ids || ids.length === 0) {
        return [];
      }

      const roles = await this.roleRepository.find({
        where: { id: In(ids) },
        relations: {
          shop: true,
          permissions: true,
          users: true,
        },
      });

      return roles;
    } catch (error) {
      console.error(`Error finding roles by IDs: ${error.message}`);
    }
  }

  async findByUserId(userId: string): Promise<Role[]> {
    const roles = await this.roleRepository.find({
      where: {
        users: { id: userId },
      },
      relations: {
        shop: true,
        permissions: true,
        users: true,
      },
    });

    if (roles.length === 0) {
      throw new NotFoundException(`No roles found for user ID ${userId}`);
    }

    return roles;
  }

  async delete(id: number): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: {
        shop: true,
        permissions: true,
        users: true, // Ensure users relation is loaded to check for conflicts
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    if (role.users.length > 0) {
      throw new ConflictException(
        `Role with ID ${id} cannot be deleted because it is assigned to users`,
      );
    }

    try {
      await this.roleRepository.remove(role);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to delete role with ID ${id}: ${error.message}`,
      );
    }
  }
}
