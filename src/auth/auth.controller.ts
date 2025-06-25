import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './gaurds/jwt-auth.guard';
import {
  CreateUserDto,
  UpdateUserDto,
  UserQueryParamsDto,
} from 'src/users/dto/user.dto';
import { RegisterDto } from './dto/register.dto';
import { Response } from 'express';

@ApiTags('Authentication & Users')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @ApiBody({
    type: RegisterDto,
  })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    try {
      return await this.authService.register(registerDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiBody({
    type: LoginDto,
  })
  @HttpCode(HttpStatus.OK)
  async login(
    @Res({ passthrough: true }) response: Response,
    @Body() loginDto: LoginDto,
  ) {
    try {
      const { accessToken, user } = await this.authService.login(loginDto);
      response.cookie('accessToken', accessToken);

      return {
        data: {
          user: user,
          accessToken: accessToken,
        },
        message: 'Login successful',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('logout')
  @ApiOperation({ summary: 'User logout' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      example: {
        message: 'Logged out successfully',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: any) {
    const userId = req.user.sub;
    const token = req.headers.authorization?.replace('Bearer ', '');
    return await this.authService.logout(userId, token);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  async getProfile(@Request() req: any) {
    // const userId = req.user.sub;
    // const user = await this.usersService.findById(userId);
    // return {
    //   id: user.id,
    //   username: user.username,
    //   email: user.email,
    //   phone: user.phone,
    //   name: user.name,
    //   avatar: user.avatar,
    //   platform: user.platform,
    //   zaloId: user.zaloId,
    //   shopId: user.shopId,
    //   createdAt: user.createdAt,
    //   updatedAt: user.updatedAt,
    // };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        expiresIn: 86400,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    // const payload = await this.authService.verifyRefreshToken(refreshToken);
    // const user = await this.usersService.findById(payload.sub);
    // const tokens = await this.authService.generateTokens(user);
    // return {
    //   accessToken: tokens.accessToken,
    //   expiresIn: this.authService['getTokenExpirationTime'](),
    // };
  }

  // =============== USER CRUD ENDPOINTS ===============

  @Get('users')
  @ApiOperation({ summary: 'Get all users with pagination and filtering' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name, username, or email',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 20,
  })
  @ApiQuery({
    name: 'shopId',
    required: false,
    description: 'Filter by shop ID',
  })
  @ApiQuery({
    name: 'platform',
    required: false,
    description: 'Filter by platform',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
  })
  async getUsers(@Query() query: UserQueryParamsDto) {
    // return await this.usersService.query(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'User found',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserById(@Param('id', ParseUUIDPipe) id: string) {
    // const user = await this.usersService.findById(id);
    // if (!user) {
    //   throw new Error('User not found');
    // }
    // return user;
  }

  @Post('users')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({
    type: CreateUserDto,
    examples: {
      createUser: {
        summary: 'Create User Example',
        description: 'Create a new user account',
        value: {
          username: 'jane.doe',
          email: 'jane.doe@example.com',
          password: 'securePassword123',
          name: 'Jane Doe',
          phone: '+1234567891',
          platform: 'web',
          shopId: 'shop-123',
          avatar: 'https://example.com/avatar.jpg',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 409,
    description: 'User already exists',
  })
  async createUser(@Body() createUserDto: CreateUserDto) {
    // Hash password before creating user
    const hashedPassword = await this.authService.hashPassword(
      createUserDto.password,
    );
    const userData = {
      ...createUserDto,
      password: hashedPassword,
    };

    return await this.usersService.create(userData);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: UpdateUserDto,
    examples: {
      updateUser: {
        summary: 'Update User Example',
        description: 'Update user information',
        value: {
          name: 'Jane Smith',
          phone: '+1234567892',
          avatar: 'https://example.com/new-avatar.jpg',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // If password is being updated, hash it
    if (updateUserDto.password) {
      updateUserDto.password = await this.authService.hashPassword(
        updateUserDto.password,
      );
    }

    return await this.usersService.update(id, updateUserDto);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    schema: {
      example: {
        message: 'User deleted successfully',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }

  @Put('users/:id/password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        currentPassword: {
          type: 'string',
          description: 'Current password',
          example: 'oldPassword123',
        },
        newPassword: {
          type: 'string',
          description: 'New password',
          example: 'newPassword123',
        },
      },
      required: ['currentPassword', 'newPassword'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Current password is incorrect',
  })
  async changePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changePasswordDto: { currentPassword: string; newPassword: string },
    @Request() req: any,
  ) {
    // Ensure user can only change their own password or admin can change any
    // const currentUserId = req.user.sub;
    // if (currentUserId !== id) {
    //   // Add admin check here if needed
    //   throw new Error('Unauthorized to change this password');
    // }
    // const user = await this.usersService.findById(id);
    // const isCurrentPasswordValid = await this.authService.comparePassword(
    //   changePasswordDto.currentPassword,
    //   user.password,
    // );
    // if (!isCurrentPasswordValid) {
    //   throw new Error('Current password is incorrect');
    // }
    // const hashedNewPassword = await this.authService.hashPassword(
    //   changePasswordDto.newPassword,
    // );
    // await this.usersService.update(id, { password: hashedNewPassword });
    // return { message: 'Password changed successfully' };
  }

  @Post('users/:id/activate')
  @ApiOperation({ summary: 'Activate user account' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'User activated successfully',
  })
  async activateUser(@Param('id', ParseUUIDPipe) id: string) {
    // await this.usersService.update(id, { isActive: true });
    // return { message: 'User activated successfully' };
  }

  @Post('users/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate user account' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'User deactivated successfully',
  })
  async deactivateUser(@Param('id', ParseUUIDPipe) id: string) {
    // await this.usersService.update(id, { isActive: false });
    // return { message: 'User deactivated successfully' };
  }
}
