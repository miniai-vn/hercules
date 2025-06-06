import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.module';
import { ConversationsService } from './conversations.service';
import {
  AddParticipantsDto,
  ConversationQueryParamsDto,
  ConversationResponseDto,
  CreateConversationDto,
  PaginatedConversationsDto,
  UpdateConversationDto,
} from './dto/conversation.dto';

interface ApiResponse<T> {
  message: string;
  data: T;
}

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    username: string;
    shop_id: string;
    iat?: number;
    exp?: number;
  };
}

@ApiTags('conversations')
@ApiBearerAuth('bearerAuth')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({
    status: 201,
    description: 'Conversation created successfully',
    type: ConversationResponseDto,
  })
  async create(
    @Body() createConversationDto: CreateConversationDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<ConversationResponseDto>> {
    const conversation = await this.conversationsService.create(
      createConversationDto,
      req.user.shop_id, // Get shopId from request user
    );
    return {
      message: 'Conversation created successfully',
      data: conversation,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all conversations with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Conversations retrieved successfully',
    type: PaginatedConversationsDto,
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search', new DefaultValuePipe('')) search: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<PaginatedConversationsDto>> {
    const conversations = await this.conversationsService.findAll(
      page,
      limit,
      search,
      req.user.shop_id, // Get shopId from request user
    );
    return {
      message: 'Conversations retrieved successfully',
      data: conversations,
    };
  }

  @Get('query')
  @ApiOperation({ summary: 'Query conversations with custom parameters' })
  @ApiResponse({
    status: 200,
    description: 'Conversations queried successfully',
  })
  @ApiQuery({ name: 'type', required: false, description: 'Conversation type' })
  @ApiQuery({ name: 'name', required: false, description: 'Conversation name' })
  @ApiQuery({
    name: 'channelId',
    required: false,
    type: Number,
    description: 'Channel ID',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'User ID',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term for conversation name or content',
  })
  @ApiQuery({
    name: 'channelType',
    required: false,
    type: String,
    description: 'Channel type (e.g., Zalo, Facebook)',
  })
  async query(@Req() req, @Query() queryParams: ConversationQueryParamsDto) {
    const shopId = req.user.shop_id;
    queryParams.shopId = shopId;
    const userId = req.user.user_id;
    queryParams.userId = userId;
    return {
      message: 'Conversations queried successfully',
      data: await this.conversationsService.query(queryParams),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific conversation by ID' })
  @ApiResponse({
    status: 200,
    description: 'Conversation retrieved successfully',
    type: ConversationResponseDto,
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<ConversationResponseDto>> {
    const conversation = await this.conversationsService.findOne(id);
    return {
      message: 'Conversation retrieved successfully',
      data: conversation,
    };
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages for a specific conversation' })
  @ApiResponse({
    status: 200,
    description: 'Returns messages for the conversation',
  })
  async getFullInfoConversation(@Param('id', ParseIntPipe) id: number) {
    const data = await this.conversationsService.getFullInfoConversation(id);
    return {
      message: 'Conversation messages retrieved successfully',
      data,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a conversation' })
  @ApiResponse({
    status: 200,
    description: 'Conversation updated successfully',
    type: ConversationResponseDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateConversationDto: UpdateConversationDto,
  ): Promise<ApiResponse<ConversationResponseDto>> {
    const conversation = await this.conversationsService.update(
      id,
      updateConversationDto,
    );
    return {
      message: 'Conversation updated successfully',
      data: conversation,
    };
  }

  @Post(':id/participants')
  @ApiOperation({ summary: 'Add participants to a conversation' })
  @ApiResponse({
    status: 200,
    description: 'Participants added successfully',
    type: ConversationResponseDto,
  })
  async addParticipants(
    @Param('id', ParseIntPipe) id: number,
    @Body() addParticipantsDto: AddParticipantsDto,
  ): Promise<ApiResponse<ConversationResponseDto>> {
    const conversation = await this.conversationsService.addParticipants(
      id,
      addParticipantsDto,
    );
    return {
      message: 'Participants added successfully',
      data: conversation,
    };
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Get participants of a conversation' })
  @ApiResponse({
    status: 200,
    description: 'Participants retrieved successfully',
  })
  async getParticipants(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<{ participants: any[] }>> {
    const participants =
      await this.conversationsService.getUsersInConversation(id);
    return {
      message: 'Participants retrieved successfully',
      data: { participants },
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a conversation' })
  @ApiResponse({
    status: 200,
    description: 'Conversation deleted successfully',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<{ id: number }>> {
    await this.conversationsService.remove(id);
    return {
      message: 'Conversation deleted successfully',
      data: { id },
    };
  }
}
