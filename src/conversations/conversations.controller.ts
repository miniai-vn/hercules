import {
  Body,
  Controller,
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
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.module';
import { ConversationsService } from './conversations.service';
import {
  AddParticipantsDto,
  AddTagsToConversationDto,
  ConversationQueryParamsDto,
  ConversationResponseDto,
  CreateConversationDto,
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
@Controller('conversations')
@ApiBearerAuth('bearerAuth')
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

  @Get('')
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
  @ApiQuery({
    name: 'tagId',
    required: false,
    type: Number,
    description: 'Filter by tag ID',
  })
  @ApiQuery({
    name: 'timeFrom',
    required: false,
    type: String,
    description:
      'Filter conversations created from this date (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'timeTo',
    required: false,
    type: String,
    description: 'Filter conversations created to this date (ISO 8601 format)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @ApiQuery({
    name: 'participantUserId',
    required: false,
    type: [String],
    description: 'Filter by participant user ID',
    isArray: true,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
    example: 10,
  })
  async query(
    @Req() req,
    @Query() queryParams: ConversationQueryParamsDto,
  ): Promise<{
    message: string;
    data: any;
  }> {
    const shopId = req.user.shop_id;
    queryParams.shopId = shopId;

    if (!queryParams.userId) {
      queryParams.userId = req.user.user_id;
    }

    return {
      message: 'Conversations queried successfully',
      data: await this.conversationsService.query({
        ...queryParams,
      }),
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

  @Get(':id/participants')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get participants of a conversation' })
  @ApiResponse({
    status: 200,
    description: 'Participants retrieved successfully',
  })
  async getParticipants(@Param('id', ParseIntPipe) id: number) {
    const participants =
      await this.conversationsService.getUsersInConversation(id);
    return {
      message: 'Participants retrieved successfully',
      data: participants,
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

  @Put(':id/mark-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a conversation as read' })
  @ApiResponse({
    status: 200,
    description: 'Conversation marked as read successfully',
  })
  async markReadConversation(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<ApiResponse<{ id: number }>> {
    const userId = req.user.user_id;
    await this.conversationsService.markReadConversation(id, userId);
    return {
      message: 'Conversation marked as read successfully',
      data: { id },
    };
  }

  @Post(':id/add-tags')
  @ApiOperation({ summary: 'Add tags to a conversation' })
  @ApiBody({ type: AddTagsToConversationDto })
  @ApiResponse({
    status: 200,
    description: 'Tags added to conversation successfully',
    schema: {
      example: {
        message: 'Tags added to conversation successfully',
        data: { conversationId: 1, tagIds: [1, 2] },
      },
    },
  })
  async addTags(
    @Param('id', ParseIntPipe) id: number,
    @Body() addTagsDto: AddTagsToConversationDto,
  ): Promise<{
    message: string;
    data: { conversationId: number };
  }> {
    await this.conversationsService.addTagsToConversation(
      id,
      addTagsDto.tagIds,
    );
    return {
      message: 'Tags added to conversation successfully',
      data: { conversationId: id },
    };
  }

  @Delete(':id/participants')
  @ApiOperation({ summary: 'Remove participants from a conversation' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        participantIds: {
          type: 'array',
          items: { type: 'number' },
          example: [1, 2, 3],
          description: 'Array of participant IDs to remove',
        },
      },
      required: ['participantIds'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Participants removed successfully',
    type: ConversationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found',
  })
  async removeParticipants(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { participantIds: number[] },
  ): Promise<ApiResponse<ConversationResponseDto>> {
    const conversation = await this.conversationsService.removeParticipants(
      id,
      body.participantIds,
    );
    return {
      message: 'Participants removed successfully',
      data: conversation,
    };
  }

  @Get(':id/tags')
  @ApiOperation({ summary: 'Get tags of a conversation' })
  @ApiResponse({
    status: 200,
    description: 'Tags retrieved successfully',
  })
  async getTags(@Param('id', ParseIntPipe) id: number) {
    const tags = await this.conversationsService.getTags(id);
    return {
      message: 'Tags retrieved successfully',
      data: tags,
    };
  }
}
