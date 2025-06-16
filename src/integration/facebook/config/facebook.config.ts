import * as dotenv from 'dotenv';

dotenv.config();

export const FACEBOOK_CONFIG = {
  BASE_PATH_FACEBOOK: 'https://graph.facebook.com/v23.0/',
  FACEBOOK_PATH: 'https://www.facebook.com/v23.0/',
  APP: {
    ID: process.env.FACEBOOK_APP_ID,
    SECRET: process.env.FACEBOOK_APP_SECRET,
  },
  ENDPOINT: {
    ME_ACCOUNTS: 'me/accounts',
    OAUTH_ACCESS_TOKEN: 'oauth/access_token',
    DIALOG_OAUTH: 'dialog/oauth',
  },
  SCOPE: 'pages_show_list,pages_messaging',
  VERIFY_TOKEN: process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN,
  REDIRECT_URL: process.env.FACEBOOK_REDIRECT_URL,
} as const;
