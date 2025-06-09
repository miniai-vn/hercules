import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  UserPaginationQueryDto,
  UserBulkDeleteDto,
  ChangePasswordDto,
  PaginatedUsersDto,
} from './dto/user.dto';
import { JwtAuthGuard } from '../auth/auth.module';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Username or email already exists',
  })
  @ApiResponse({
    status: 404,
    description: 'Shop not found',
  })
  async create(
    @Req() req,
    @Body() createUserDto: CreateUserDto,
  ): Promise<{
    message: string;
    data: UserResponseDto;
  }> {
    const shopId = req.user.shop_id; // Get shopId from authenticated user
    const user = await this.usersService.create({
      ...createUserDto,
      shopId, // Override shopId with user's shop
    });
    return {
      message: 'User created successfully',
      data: user,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  // Remove shopId from query params since it comes from req.user
  @ApiQuery({ name: 'username', required: false, type: String })
  @ApiQuery({ name: 'email', required: false, type: String })
  @ApiQuery({ name: 'platform', required: false, type: String })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: PaginatedUsersDto,
  })
  async findAll(
    @Req() req,
    @Query() query: UserPaginationQueryDto,
  ): Promise<{
    message: string;
    data: PaginatedUsersDto;
  }> {
    const shopId = req.user.shop_id; // Get shopId from authenticated user
    const result = await this.usersService.findAll({
      ...query,
      shopId, // Override shopId with user's shop
    });
    return {
      message: 'Users retrieved successfully',
      data: result,
    };
  }
}
