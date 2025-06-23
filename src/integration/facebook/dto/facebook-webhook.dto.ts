export class FacebookWebhookDTO {
  object: string;
  entry?: FacebookMessageEntryDTO[];
}

export class FacebookMessageEntryDTO {
  id: string; // Page ID
  time?: number;
  messaging: FacebookMessagingEventDTO[];
}

export class FacebookMessagingEventDTO {
  sender: { id: string }; // User PSID
  recipient: { id: string }; // Page ID
  timestamp?: number;
  message?: {
    // Có khi chỉ là message khi user nhắn
    mid?: string;
    text?: string;
  };
  postback?: any; // Nếu là postback event
}
