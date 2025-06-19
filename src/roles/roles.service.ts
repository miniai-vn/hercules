import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './roles.entity';

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
  ) {}

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
