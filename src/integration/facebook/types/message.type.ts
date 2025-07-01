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
