import { TFacebookMessage } from './message.type';
import { TFacebookUser } from './user.type';

export type TFacebookMessages = {
  data: TFacebookMessage[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
    previous?: string;
  };
};

export type TFacebookConversation = {
  id: string;
  messages?: TFacebookMessages;
};

export type TFacebookConversationResponse = {
  data: TFacebookConversation[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
    previous?: string;
  };
};

export type TConversationResponse = {
  id: string;
  content: string;
  updatedAt: string;
  members: TFacebookUser[];
  channel: {
    id: string;
    name: string;
    type: string;
  };
  tags?: string[];
  // ... các trường khác nếu cần
};
