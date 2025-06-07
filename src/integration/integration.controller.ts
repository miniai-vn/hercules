
import { Controller, Get } from '@nestjs/common';
import { IntegrationService } from './integration.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Integration')
@Controller('integration')
export class IntegrationController {

    constructor(private readonly integrationService: IntegrationService) {}

   @Get("authorize-tiktok")
    async authorizeTikTok() {
        return this.integrationService.authorizeTikTok();
    }

    @Get("tiktok/conversations")
    async getConversations() {
        return this.integrationService.getConversations();
    }

    @Get("tiktok/shop-info")
    async getShopInfo() {
        return this.integrationService.getAuthorizeShop();
    }

    @Get("tiktok/products")
    async getProducts() {
        return this.integrationService.getProducts();
    }

}
