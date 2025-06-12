export class ZaloWebhookDto {
  app_id: string;
  user_id_by_app: string;
  event_name: string;
  timestamp: number;
  message?: {
    text: string;
    msg_id: string;
    attachments?: any[];
  };
  sender?: {
    id: string;
  };
  recipient?: {
    id: string;
  };
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
