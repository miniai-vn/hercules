import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateCustomerDto,
  CustomerListQueryDto,
  CustomerResponseDto,
  FindCustomerByExternalIdDto,
  UpdateCustomerDto,
  AddTagsToCustomerDto,
  CustomerListResponseDto,
} from './customers.dto';
import { CustomersService } from './customers.service';

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({
    status: 201,
    description: 'Customer created successfully',
    type: CustomerResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - customer already exists',
  })
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customersService.create(createCustomerDto);
  }

  @Get('/query')
  @ApiOperation({ summary: 'Get all customers with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of customers retrieved successfully',
    type: CustomerListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiQuery({
    name: 'platform',
    required: false,
    description: 'Filter by platform',
  })
  @ApiQuery({
    name: 'channelId',
    required: false,
    description: 'Filter by channel ID',
  })
  @ApiQuery({ name: 'name', required: false, description: 'Search by name' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async findAll(@Query() query: CustomerListQueryDto) {
    return this.customersService.query(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer found',
    type: CustomerResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return {
      message: 'Customer retrieved successfully',
      data: await this.customersService.findOne(id),
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update customer by ID' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer updated successfully',
    type: CustomerResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete customer by ID' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: 204,
    description: 'Customer deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found',
  })
  async remove(@Param('id', ParseIntPipe) id: string): Promise<void> {
    return this.customersService.remove(id);
  }
  @Post(':id/add-tags')
  async addTagsToCustomer(
    @Param('id') id: string,
    @Body() body: AddTagsToCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customersService.addTagsToCustomer(id, body.tagIds);
  }
}
