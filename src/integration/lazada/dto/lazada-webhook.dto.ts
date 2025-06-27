export class LazadaWebhookDto {
  event: string;
  data: any;
  timestamp: number;
  signature?: string;
}

export class LazadaOrderDto {
  order_id: string;
  order_number: string;
  status: string;
  created_at: string;
  updated_at: string;
  customer_first_name: string;
  customer_last_name: string;
  payment_method: string;
  shipping_fee: number;
  total_amount: number;
  order_items: LazadaOrderItemDto[];
}

export class LazadaOrderItemDto {
  order_item_id: string;
  shop_id: string;
  order_id: string;
  name: string;
  sku: string;
  variation: string;
  quantity: number;
  item_price: number;
  paid_price: number;
  product_main_image: string;
  product_detail_url: string;
  is_digital: boolean;
  purchase_order_id: string;
  purchase_order_number: string;
  package_id: string;
  buyer_id: string;
  shop_sku: string;
  is_fbl: boolean;
  promised_shipping_times: string;
  shipping_type: string;
  created_at: string;
  updated_at: string;
  return_status: string;
}

export class LazadaProductDto {
  item_id: string;
  primary_category: number;
  attributes: Record<string, any>;
  skus: LazadaSkuDto[];
  images: string[];
}

export class LazadaSkuDto {
  SellerSku: string;
  quantity: number;
  price: number;
  package_length: string;
  package_height: string;
  package_weight: string;
  package_width: string;
  Images: {
    Image: string[];
  };
}

export class LazadaAuthDto {
  app_key: string;
  app_secret: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

export class LazadaInventoryUpdateDto {
  item_id: string;
  skus: {
    SellerSku: string;
    Quantity: number;
    Price: number;
  }[];
}
