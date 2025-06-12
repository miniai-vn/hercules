import { Controller, Get, Post, Body, Res, Query, Param } from '@nestjs/common';
import { IntegrationService } from './integration.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZaloService } from './zalo/zalo.service';
import { Response } from 'express';
import { join } from 'path';

@ApiTags('Integration')
@Controller('integration')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  //    @Get("authorize-tiktok")
  //     async authorizeTikTok() {
  //         return this.integrationService.authorizeTikTok();
  //     }

  //     @Get("tiktok/conversations")
  //     async getConversations() {
  //         return this.integrationService.getConversations();
  //     }

  //     @Get("tiktok/shop-info")
  //     async getShopInfo() {
  //         return this.integrationService.getAuthorizeShop();
  //     }

  //     @Get("tiktok/products")
  //     async getProducts() {
  //         return this.integrationService.getProducts();
  //     }
}
