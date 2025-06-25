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
import { JwtAuthGuard } from 'src/auth/gaurds/jwt-auth.guard';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { PermissionCode } from 'src/common/enums/permission.enum';
import { PermissionsGuard } from 'src/auth/gaurds/permission.guard';

interface ApiResponse<T> {
  message: string;
  data: T;
}

@Controller('channels')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard, PermissionsGuard) // Apply guard to all routes in this controller
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  @RequirePermissions(PermissionCode.CHANNEL_CREATE)
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
  @RequirePermissions(PermissionCode.CHANNEL_READ)
  async findAllForShop(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number, // Changed from perPage for consistency if desired
  ): Promise<ApiResponse<PaginatedChannelsDto>> {
    const shopId = req.user.shopId; // Assuming req.user.shopId is the correct way to get shop ID
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
  @RequirePermissions(PermissionCode.CHANNEL_READ)
  @ApiOperation({ summary: 'Get unread message count by shopId and userId' })
  async getUnreadCount(@Request() req) {
    const shopId = req.user.shopId;
    const userId = req.user.userId; // Assuming req.user.id is the correct way to get user ID
    return {
      message: 'Unread message count retrieved successfully',
      data: await this.channelsService.getByShopIdAndUserIdAndCountUnreadMessages(
        shopId,
        userId,
      ),
    };
  }

  @Get('query')
  @RequirePermissions(PermissionCode.CHANNEL_READ)
  async queryChannelsForShop(
    @Request() req,
    @Query() queryParams: ChannelQueryParamsDto,
  ): Promise<ApiResponse<Channel[]>> {
    try {
      const channels = await this.channelsService.query({
        ...queryParams,
        shopId: req.user.shopId,
        userId: req.user.userId,
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
  @RequirePermissions(PermissionCode.CHANNEL_READ)
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
  @RequirePermissions(PermissionCode.CHANNEL_UPDATE)
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
  @RequirePermissions(PermissionCode.CHANNEL_DELETE)
  @HttpCode(HttpStatus.OK) // Or HttpStatus.NO_CONTENT if no body is returned
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<null | { id: number }>> {
    await this.channelsService.delete(id);
    return {
      message: 'Channel deleted successfully',
      data: { id }, // Or simply null if you prefer
    };
  }

  @Patch(':id/update-status')
  @RequirePermissions(PermissionCode.CHANNEL_UPDATE)
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

  @Post(':id/add-users')
  @RequirePermissions(PermissionCode.CHANNEL_UPDATE)
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
  @RequirePermissions(PermissionCode.CHANNEL_UPDATE)
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
  @RequirePermissions(PermissionCode.CHANNEL_UPDATE)
  @ApiOperation({ summary: 'Update shop ID for a channel' })
  @ApiResponse({ status: 200, description: 'Shop ID updated successfully' })
  async updateShopId(
    @Request() req,
    @Body('appId') appId: string,
  ): Promise<ApiResponse<Channel>> {
    const shop = req.shop;
    const updatedChannels = await this.channelsService.updateShopId(
      shop,
      appId,
      req.user.userId,
    );
    return {
      message: 'Shop ID updated successfully',
      data: updatedChannels,
    };
  }

  @Post('sync-conversations')
  @RequirePermissions(PermissionCode.CHANNEL_UPDATE)
  @ApiOperation({ summary: 'Sync conversations for a channel' })
  @ApiResponse({
    status: 200,
    description: 'Conversations synced successfully',
  })
  async syncConversations(@Param('id', ParseIntPipe) channelId: number) {
    // const result = await this.channelsService.syncConversations(channelId);
    // return {
    //   message: 'Conversations synced successfully',
    //   data: result,
    // };
  }
}
