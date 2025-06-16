import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard'; // Ensure this path is correct
import { Channel } from './channels.entity';
import { ChannelsService } from './channels.service';
import { ChannelUserIdsDto } from './dto/channel-user-ids.dto';
import {
  ChannelBulkDeleteDto,
  ChannelQueryParamsDto,
  CreateChannelDto,
  PaginatedChannelsDto,
  UpdateChannelDto,
  UpdateChannelStatusDto,
} from './dto/channel.dto';

interface ApiResponse<T> {
  message: string;
  data: T;
}

@Controller('channels')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard) // Apply guard to all routes in this controller
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req,
    @Body() createChannelDto: CreateChannelDto,
  ): Promise<ApiResponse<Channel>> {
    const createdChannel = await this.channelsService.create(createChannelDto);
    return {
      message: 'Channel created successfully',
      data: createdChannel,
    };
  }

  @Get()
  async findAllForShop(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number, // Changed from perPage for consistency if desired
  ): Promise<ApiResponse<PaginatedChannelsDto>> {
    const shopId = req.user.shop_id; // Assuming req.user.shop_id is the correct way to get shop ID
    const paginatedChannels = await this.channelsService.getByShopId(
      shopId,
      page,
      limit,
    );
    return {
      message: 'Channels retrieved successfully',
      data: paginatedChannels,
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread message count by shopId and userId' })
  async getUnreadCount(@Request() req) {
    const shopId = req.user.shop_id;
    const userId = req.user.user_id; // Assuming req.user.id is the correct way to get user ID
    return {
      message: 'Unread message count retrieved successfully',
      data: await this.channelsService.getByShopIdAndUserIdAndCountUnreadMessages(
        shopId,
        userId,
      ),
    };
  }

  @Get('query')
  async queryChannelsForShop(
    @Request() req,
    @Query() queryParams: ChannelQueryParamsDto,
  ): Promise<ApiResponse<Channel[]>> {
    try {
      const channels = await this.channelsService.query({
        ...queryParams,
        shopId: req.user.shop_id,
        userId: req.user.user_id,
      });
      return {
        message: 'Channels queried successfully',
        data: channels,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error querying channels: ' + error.message,
      );
    }
  }

  @Get(':id')
  async findOneForShop(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<Channel>> {
    const channel = await this.channelsService.getOne(id);
    return {
      message: 'Channel retrieved successfully',
      data: channel,
    };
  }

  @Put(':id')
  async updateForShop(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChannelDto: UpdateChannelDto,
  ): Promise<ApiResponse<Channel>> {
    const updatedChannel = await this.channelsService.update(
      id,
      updateChannelDto,
    );
    return {
      message: 'Channel updated successfully',
      data: updatedChannel,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard) // Ensure this route is protected
  @HttpCode(HttpStatus.OK) // Or HttpStatus.NO_CONTENT if no body is returned
  async removeForShop(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<null | { id: number }>> {
    await this.channelsService.delete(id);
    return {
      message: 'Channel deleted successfully',
      data: { id }, // Or simply null if you prefer
    };
  }

  @Patch(':id/update-status')
  async updateStatusForShop(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChannelStatusDto: UpdateChannelStatusDto,
  ): Promise<ApiResponse<Channel>> {
    const updatedChannel = await this.channelsService.updateStatus(
      id,
      updateChannelStatusDto,
    );
    return {
      message: 'Channel status updated successfully',
      data: updatedChannel,
    };
  }

  @Post('bulk-delete')
  async bulkDeleteForShop(
    @Request() req,
    @Body() bulkDeleteDto: ChannelBulkDeleteDto,
  ): Promise<
    ApiResponse<{
      totalRequested: number;
      deletedCount: number;
      notFoundCount: number;
    }>
  > {
    const result = await this.channelsService.bulkDelete(bulkDeleteDto);
    return {
      message: 'Bulk delete operation completed',
      data: result,
    };
  }

  @Post(':id/add-users')
  @ApiOperation({ summary: 'Add multiple users to a channel' })
  @ApiResponse({ status: 200, description: 'Users added to channel' })
  async addUsersToChannel(
    @Param('id', ParseIntPipe) channelId: number,
    @Body() body: ChannelUserIdsDto,
  ): Promise<ApiResponse<Channel>> {
    const channel = await this.channelsService.addUsers(
      channelId,
      body.userIds,
    );
    return {
      message: 'Users added to channel',
      data: channel,
    };
  }

  @Post(':id/remove-users')
  @ApiOperation({ summary: 'Remove multiple users from a channel' })
  @ApiResponse({ status: 200, description: 'Users removed from channel' })
  async removeUsersFromChannel(
    @Param('id', ParseIntPipe) channelId: number,
    @Body() body: ChannelUserIdsDto,
  ): Promise<ApiResponse<Channel>> {
    const channel = await this.channelsService.removeUsers(
      channelId,
      body.userIds,
    );
    return {
      message: 'Users removed from channel',
      data: channel,
    };
  }

  @Patch('update-shop')
  @ApiOperation({ summary: 'Update shop ID for a channel' })
  @ApiResponse({ status: 200, description: 'Shop ID updated successfully' })
  async updateShopId(
    @Request() req,
    @Body('appId') appId: string,
  ): Promise<ApiResponse<Channel>> {
    const shop = req.shop; // Assuming req.user.shop_id is the correct way to get shop ID
    const updatedChannels = await this.channelsService.updateShopId(
      shop,
      appId,
    );
    return {
      message: 'Shop ID updated successfully',
      data: updatedChannels,
    };
  }
}
