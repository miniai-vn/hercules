import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './roles.entity';
import { PermissionCode } from 'src/common/enums/permission.enum';
import { Permission } from 'src/permissions/permissions.entity';
import { Shop } from 'src/shops/shops.entity';
import { PermissionsService } from 'src/permissions/permissions.service';

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
export interface CreateRoleDto {
  name: string;
  description?: string;
  shopId: number;
  permissionIds?: number[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissionIds?: number[];
}

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
    permissions: Permission[],
  ) {
    const newRole = this.roleRepository.create({
      name,
      description,
      shop: shop,
    });
    try {
      return await this.roleRepository.save({
        ...newRole,
        permissions: permissions.map((permission) => ({ id: permission.id })),
      });
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Role name already exists');
      }
      throw error;
    }
  }

  async initRoleDefault(shop: Shop): Promise<boolean> {
    try {
      for (const key in DEFAULT_ROLES) {
        const roleData = DEFAULT_ROLES[key];
        const permissionPromise = roleData.permissions.map(
          async (code) => await this.permissionService.findByCode(code),
        );

        const permissions = await Promise.all(permissionPromise);

        await this.create(
          roleData.name,
          roleData.description,
          shop,
          permissions.filter((p) => p != null),
        );
      }
      return true;
    } catch (error) {
      throw new Error(`Failed to initialize default roles for shop`);
    }
  }

  async findByUserId(userId: string): Promise<Role[]> {
    return await this.roleRepository.find({
      where: { users: { id: userId } },
      relations: ['shop', 'permissions', 'users'],
    });
  }

  // Get all roles
  async findAll(): Promise<Role[]> {
    return await this.roleRepository.find({
      relations: ['shop', 'permissions', 'users'],
    });
  }

  // Get role by ID
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

  // Update role
  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    if (updateRoleDto.name) {
      role.name = updateRoleDto.name;
    }

    if (updateRoleDto.description !== undefined) {
      role.description = updateRoleDto.description;
    }

    if (updateRoleDto.permissionIds) {
      role.permissions = updateRoleDto.permissionIds.map(
        (id) => ({ id }) as any,
      );
    }

    try {
      return await this.roleRepository.save(role);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Role name already exists');
      }
      throw error;
    }
  }

  // Delete role
  async remove(id: number): Promise<void> {
    const role = await this.findOne(id);
    await this.roleRepository.remove(role);
  }
}
