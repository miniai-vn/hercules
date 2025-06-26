import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { FindManyOptions, ILike, In, Repository } from 'typeorm';
import { ShopService } from '../shops/shops.service';
import {
  ChangePasswordDto,
  CreateUserDto,
  UpdateUserDto,
  UserBulkDeleteDto,
  UserQueryParamsDto,
  UserResponseDto,
} from './dto/user.dto';
import { User } from './entities/users.entity';
import { PaginatedResult } from 'src/common/types/reponse.type';
import { RolesService } from 'src/roles/roles.service';

export class UserPaginationQueryDto extends UserQueryParamsDto {
  page?: number = 1;
  limit?: number = 10;
  search?: string;
  sortBy?: string = 'createdAt';
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly shopService: ShopService,
    private readonly roleService: RolesService, // Assuming RoleService is injected for role management
  ) {}

  async getOne(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['shop'],
    });
  }

  async findByIds(ids: string[]): Promise<User[]> {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return [];
    }

    return this.usersRepository.findBy({ id: In(ids) });
  }

  async delete(id: string): Promise<string> {
    try {
      await this.usersRepository.softDelete(id);
      return id;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to delete user: ${error.message}`,
      );
    }
  }

  async query(query: UserPaginationQueryDto): Promise<PaginatedResult<User>> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        ...filters
      } = query;

      // Build where conditions
      const filter: FindManyOptions<User> = {
        where: {
          ...(filters.search && {
            username: ILike(`%${filters.search}%`),
          }),
          ...(filters.email && { email: ILike(`%${filters.email}%`) }),
          ...(filters.platform && {
            platform: ILike(`%${filters.platform}%`),
          }),
          ...(filters.name && { name: ILike(`%${filters.name}%`) }),
          ...(filters.shopId && { shop: { id: filters.shopId } }),
        },
        relations: {
          shop: true, // Include shop relation
          roles: true, // Include roles relation
          channels: true, // Include channels relation
          departments: true, // Include departments relation
        },
        order: {
          [sortBy]: sortOrder.toUpperCase() as 'ASC' | 'DESC',
        },
        skip: (page - 1) * limit,
        take: limit,
      };

      const [users, total] = await this.usersRepository.findAndCount(filter);

      return {
        data: users,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
        total: total,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get users: ${error.message}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.usersRepository.findOne({
        where: { id },
        relations: {
          shop: true,
          roles: true,
          channels: true,
          departments: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to get user: ${error.message}`,
      );
    }
  }

  async create(createUserDto: CreateUserDto) {
    try {
      // Check if shop exists using ShopService
      const shop = await this.shopService.findOne(createUserDto.shopId);
      if (!shop) {
        throw new NotFoundException('Shop not found');
      }

      // Check if username already exists
      const existingUser = await this.usersRepository.findOne({
        where: { username: createUserDto.username },
      });
      if (existingUser) {
        throw new BadRequestException('Username already exists');
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(
        createUserDto.password,
        saltRounds,
      );

      // Create user
      const user = this.usersRepository.create({
        ...createUserDto,
        password: hashedPassword,
        shop,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const roles = await this.roleService.findByIds(createUserDto.roleIds);
      const savedUser = await this.usersRepository.save({
        ...user,
        roles: roles,
      });
      return savedUser;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to create user: ${error.message}`,
      );
    }
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id },
        relations: {
          shop: true,
          roles: true,
          channels: true,
          departments: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if username already exists (if updating username)
      if (updateUserDto.username && updateUserDto.username !== user.username) {
        const existingUser = await this.usersRepository.findOne({
          where: { username: updateUserDto.username },
        });
        if (existingUser) {
          throw new BadRequestException('Username already exists');
        }
      }

      // Hash password if provided
      if (updateUserDto.password) {
        const saltRounds = 10;
        updateUserDto.password = await bcrypt.hash(
          updateUserDto.password,
          saltRounds,
        );
      }

      const roles = await this.roleService.findByIds(updateUserDto.roleIds);
      user.roles = roles ?? [];
      return await this.usersRepository.save(user);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to update user: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.usersRepository.softDelete(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to remove user: ${error.message}`,
      );
    }
  }

  async bulkDelete(dto: UserBulkDeleteDto): Promise<{ deleted: number }> {
    try {
      if (
        !dto.userIds ||
        !Array.isArray(dto.userIds) ||
        dto.userIds.length === 0
      ) {
        return { deleted: 0 };
      }

      const users = await this.usersRepository.find({
        where: { id: In(dto.userIds) },
      });

      if (!users.length) {
        return { deleted: 0 };
      }

      await this.usersRepository.remove(users);
      return { deleted: users.length };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to bulk delete users: ${error.message}`,
      );
    }
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    try {
      const user = await this.usersRepository.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        changePasswordDto.currentPassword,
        user.password,
      );

      if (!isCurrentPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(
        changePasswordDto.newPassword,
        saltRounds,
      );

      // Update password
      user.password = hashedNewPassword;
      user.updatedAt = new Date();

      await this.usersRepository.save(user);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to change password: ${error.message}`,
      );
    }
  }

  async findByShopId(shopId: string): Promise<UserResponseDto[]> {
    try {
      const users = await this.usersRepository.find({
        where: { shop: { id: shopId } },
        relations: ['shop'],
        order: { createdAt: 'DESC' },
      });

      return users.map((user) => this.toResponseDto(user));
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get users by shop ID: ${error.message}`,
      );
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      return await this.usersRepository.findOne({
        where: { username },
        relations: ['shop', 'roles'],
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to find user by username: ${error.message}`,
      );
    }
  }

  async findAdminChannel(chanelId: number) {
    try {
      const users = await this.usersRepository.find({
        where: {
          channels: {
            id: chanelId,
          },
        },
      });
      return users;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to find admin channel: ${error.message}`,
      );
    }
  }

  private toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      name: user.name,
      avatar: user.avatar,
      shopId: user.shop?.id,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };
  }
}
