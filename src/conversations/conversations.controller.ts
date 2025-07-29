import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
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
import { JwtAuthGuard } from 'src/auth/gaurds/jwt-auth.guard';
import { ConversationsService } from './conversations.service';
import {
  AddParticipantsDto,
  ConversationQueryParamsDto,
  UpdateConversationDto,
} from './dto/conversation.dto';

interface ApiResponse<T> {
  message: string;
  data: T;
}

@ApiTags('conversations')
@Controller('conversations')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get('')
  @ApiOperation({ summary: 'Query conversations with custom parameters' })
  @ApiResponse({
    status: 200,
    description: 'Conversations queried successfully',
  })
  @ApiQuery({
    required: false,
    description: 'Conversation type',
  })
  async query(@Req() req, @Query() queryParams: ConversationQueryParamsDto) {
    const shopId = req.user.shopId;
    queryParams.shopId = shopId;

    if (!queryParams.userId) {
      queryParams.userId = req.user.userId;
    }

    const result = await this.conversationsService.query(queryParams);

    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific conversation by ID' })
  @ApiResponse({
    status: 200,
    description: 'Conversation retrieved successfully',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const conversation = await this.conversationsService.findOne(id);
    return {
      message: 'Conversation retrieved successfully',
      data: conversation,
    };
  }

  @Get(':id/messages')
  async getFullInfoConversation(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.conversationsService.getFullInfoConversation(
      id,
      page,
      limit,
    );
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
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateConversationDto: UpdateConversationDto,
  ) {
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
  })
  async addParticipants(
    @Param('id', ParseIntPipe) id: number,
    @Body() addParticipantsDto: AddParticipantsDto,
  ) {
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
    const userId = req.user.userId;
    await this.conversationsService.markReadConversation(id, userId);
    return {
      message: 'Conversation marked as read successfully',
      data: { id },
    };
  }

  @Post(':id/add-tags')
  @ApiOperation({ summary: 'Add tags to a conversation' })
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
    @Body() addTagsDto: { tagIds: number[] },
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
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found',
  })
  async removeParticipants(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { participantIds: number[] },
  ) {
    const conversation = await this.conversationsService.removeParticipants(
      id,
      body.participantIds,
    );
    return {
      message: 'Participants removed successfully',
      data: conversation,
    };
  }

  @Patch('status-bot')
  @ApiOperation({ summary: 'Update bot status for conversations' })
  async updateBotStatus(@Body() body: { conversationId: number }) {
    const updatedStatus = await this.conversationsService.updateBotStatus(
      body.conversationId,
    );
    return {
      message: 'Bot status updated successfully',
      data: { status: updatedStatus },
    };
  }
}
