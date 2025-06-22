import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt-auth.guard';
import { CreateUserDto, UserPaginationQueryDto } from './dto/user.dto';
import { UsersService } from './users.service';

// @UseInterceptors(ResponseInterceptor)
@ApiTags('Users')
@Controller('users')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  async create(@Req() req, @Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create({
      ...createUserDto,
      shopId: req.shop.id,
    });
    return {
      message: 'User created successfully',
      data: user,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filtering' })
  @ApiQuery({
    name: 'query',
    required: false,
    type: UserPaginationQueryDto,
  })
  async query(@Req() req, @Query() query: UserPaginationQueryDto) {
    const shopId = req.user.shopId;
    const result = await this.usersService.query({
      ...query,
      shopId: query.shopId ?? shopId,
    });
    return result;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiBody({ type: CreateUserDto })
  async update(@Param('id') id: string, @Body() updateUserDto: CreateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    return {
      message: 'User updated successfully',
      data: user,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by ID' })
  async delete(@Param('id') id: string) {
    await this.usersService.delete(id);
    return {
      message: 'User deleted successfully',
      data: id,
    };
  }
}
