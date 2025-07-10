import { MessageType } from 'src/common/enums/message.enum';
import { TFacebookUser } from './user.type';

export type TFacebookMessage = {
  id: string;
  message?: string;
  created_time: string;
  from: TFacebookUser;
  to?: {
    data: TFacebookUser[];
  };
};

export type FacebookAttachment = {
  type: MessageType;
  url?: string;
  payload?: {
    url?: string;
    thumb?: string;
  };
};
