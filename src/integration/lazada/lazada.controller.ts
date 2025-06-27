import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response, Request } from 'express';
import { LazadaWebhookDto } from './dto/lazada-webhook.dto';
import { LazadaService } from './lazada.service';

@ApiTags('Integration')
@Controller('integration/lazada')
export class LazadaController {
  constructor(
    private readonly lazadaService: LazadaService,
    // @InjectQueue(process.env.REDIS_LAZADA_SYNC_TOPIC)
    // private readonly lazadaSyncQueue: Queue,
  ) {}

  @Get('auth')
  @ApiOperation({ summary: 'Lazada OAuth authorization handler' })
  @ApiQuery({ name: 'code', description: 'Authorization code from Lazada' })
  @ApiQuery({ name: 'app_key', description: 'Lazada app key' })
  @ApiResponse({ status: 302, description: 'Redirect to dashboard' })
  async lazadaAuthHandler(
    @Query('code') code: string,
    @Query('app_key') appKey: string,
    @Res() res: Response,
    @Req() req: Request, // Use any type for request to access headers if needed
  ) {
    // https://auth.lazada.com/oauth/authorize?response_type=code&force_auth=true&redirect_uri=https://680a-42-117-111-89.ngrok-free.app/api/integration/lazada/auth&client_id=133681
    console.log(code);
    return res.status(HttpStatus.OK).json({
      message: 'Lazada auth handler called',
    });
    // try {
    //   // Get app secret from environment or database based on app_key
    //   const appSecret = process.env.LAZADA_APP_SECRET; // You should get this from your channel configuration

    //   const tokenData = await this.lazadaService.getAccessToken(
    //     code,
    //     appKey,
    //     appSecret,
    //   );

    //   // You can redirect to your dashboard with the token data
    //   // Or save it to your database
    //   const redirectUrl = `${process.env.FRONTEND_URL}/dashboard?lazada_auth=success`;
    //   //   return res.redirect(redirectUrl);
    //   return '';
    // } catch (error) {
    //   console.error('Lazada auth error:', error);
    //   const errorUrl = `${process.env.FRONTEND_URL}/dashboard?lazada_auth=error&message=${encodeURIComponent(error.message)}`;
    //   return res.redirect(errorUrl);
    // }
  }

  @Post('webhook/receive')
  @ApiOperation({ summary: 'Receive Lazada webhook events' })
  @ApiBody({ type: LazadaWebhookDto })
  @ApiResponse({ status: 200, description: 'Webhook event received' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async receiveLazadaWebhook(
    @Body() body: LazadaWebhookDto,
    @Headers('x-lazada-signature') signature: string,
    @Res() res: Response,
  ) {
    try {
      // Verify webhook signature if provided
      if (signature) {
        const webhookSecret = process.env.LAZADA_WEBHOOK_SECRET;
        const isValid = this.lazadaService.verifyWebhookSignature(
          JSON.stringify(body),
          signature,
          webhookSecret,
        );

        if (!isValid) {
          return res.status(HttpStatus.UNAUTHORIZED).json({
            error: 'Invalid webhook signature',
          });
        }
      }

      // Process webhook asynchronously
      res.status(HttpStatus.OK).json({ status: 'received' });

      await this.lazadaService.handleWebhook(body);
    } catch (error) {
      console.error('Lazada webhook error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to process webhook',
        message: error.message,
      });
    }
  }

  @Post('sync-orders/:channelId')
  @ApiOperation({ summary: 'Sync Lazada orders for a specific channel' })
  @ApiParam({ name: 'channelId', description: 'Channel ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Orders sync initiated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid channel ID or missing credentials',
  })
  async syncLazadaOrders(@Param('channelId') channelId: string) {
    // try {
    //   if (!channelId) {
    //     throw new BadRequestException('Channel ID is required');
    //   }
    //   const job = await this.lazadaSyncQueue.add('sync-orders', {
    //     channelId: channelId,
    //     syncType: 'manual',
    //   });
    //   return {
    //     message: 'Lazada orders sync initiated successfully',
    //     jobId: job.id,
    //     status: 'pending',
    //   };
    // } catch (error) {
    //   throw new BadRequestException(
    //     `Failed to initiate sync: ${error.message}`,
    //   );
    // }
  }

  @Post('sync-products/:channelId')
  @ApiOperation({ summary: 'Sync Lazada products for a specific channel' })
  @ApiParam({ name: 'channelId', description: 'Channel ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Products sync initiated successfully',
  })
  async syncLazadaProducts(@Param('channelId') channelId: string) {
    // try {
    //   if (!channelId) {
    //     throw new BadRequestException('Channel ID is required');
    //   }
    //   const job = await this.lazadaSyncQueue.add('sync-products', {
    //     channelId: channelId,
    //     syncType: 'manual',
    //   });
    //   return {
    //     message: 'Lazada products sync initiated successfully',
    //     jobId: job.id,
    //     status: 'pending',
    //   };
    // } catch (error) {
    //   throw new BadRequestException(
    //     `Failed to initiate sync: ${error.message}`,
    //   );
    // }
  }

  @Get('orders/:channelId')
  @ApiOperation({ summary: 'Get Lazada orders for a channel' })
  @ApiParam({ name: 'channelId', description: 'Channel ID', type: 'string' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of orders to fetch',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Offset for pagination',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Order status filter',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
  })
  async getLazadaOrders(
    @Param('channelId') channelId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('status') status?: string,
  ) {
    try {
      // You would typically get channel credentials from database
      // For now, using environment variables as example
      const appKey = process.env.LAZADA_APP_KEY;
      const appSecret = process.env.LAZADA_APP_SECRET;
      const accessToken = process.env.LAZADA_ACCESS_TOKEN;

      const params = {
        limit: limit || 50,
        offset: offset || 0,
        ...(status && { status }),
      };

      const orders = await this.lazadaService.getOrders(
        appKey,
        appSecret,
        accessToken,
        params,
      );

      return {
        message: 'Orders retrieved successfully',
        data: orders,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get orders: ${error.message}`);
    }
  }

  @Get('products/:channelId')
  @ApiOperation({ summary: 'Get Lazada products for a channel' })
  @ApiParam({ name: 'channelId', description: 'Channel ID', type: 'string' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of products to fetch',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Offset for pagination',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
  })
  async getLazadaProducts(
    @Param('channelId') channelId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('search') search?: string,
  ) {
    try {
      // You would typically get channel credentials from database
      const appKey = process.env.LAZADA_APP_KEY;
      const appSecret = process.env.LAZADA_APP_SECRET;
      const accessToken = process.env.LAZADA_ACCESS_TOKEN;

      const params = {
        limit: limit || 50,
        offset: offset || 0,
        ...(search && { search }),
      };

      const products = await this.lazadaService.getProducts(
        appKey,
        appSecret,
        accessToken,
        params,
      );

      return {
        message: 'Products retrieved successfully',
        data: products,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get products: ${error.message}`);
    }
  }

  @Post('inventory/update/:channelId')
  @ApiOperation({ summary: 'Update Lazada product inventory' })
  @ApiParam({ name: 'channelId', description: 'Channel ID', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        item_id: { type: 'string' },
        skus: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              SellerSku: { type: 'string' },
              Quantity: { type: 'number' },
              Price: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Inventory updated successfully',
  })
  async updateInventory(
    @Param('channelId') channelId: string,
    @Body() inventoryData: any,
  ) {
    try {
      // You would typically get channel credentials from database
      const appKey = process.env.LAZADA_APP_KEY;
      const appSecret = process.env.LAZADA_APP_SECRET;
      const accessToken = process.env.LAZADA_ACCESS_TOKEN;

      const result = await this.lazadaService.updateInventory(
        appKey,
        appSecret,
        accessToken,
        inventoryData,
      );

      return {
        message: 'Inventory updated successfully',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to update inventory: ${error.message}`,
      );
    }
  }
}
