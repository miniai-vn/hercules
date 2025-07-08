import { ApiProperty } from '@nestjs/swagger';

export class ZaloTextWebhookDto {
  @ApiProperty()
  event_name: string;

  @ApiProperty()
  app_id: string;

  // ... other properties for text webhook
}

export class ZaloImageWebhookDto {
  @ApiProperty()
  event_name: string;

  @ApiProperty()
  app_id: string;

  // ... other properties for image webhook
}

// Base webhook DTO
export class ZaloIntegrateWebhookDto {
  @ApiProperty()
  event_name: string;

  @ApiProperty()
  app_id: string;

  // ... common properties
}

export class ZaloMessageDto {
  recipient: {
    user_id: string;
  };
  message: {
    text?: string;
    attachment?: {
      type: string;
      payload: any;
    };
  };
}

export class ZaloUserProfileDto {
  user_id: string;
  name: string;
  avatar: string;
}
