import { IsString } from 'class-validator';

export class SyncDataShopDto {
  @IsString()
  shopId: string;
}
