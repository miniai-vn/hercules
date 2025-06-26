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
    DEBUG_TOKEN: 'debug_token',
  },
  SCOPE:
    'pages_show_list,pages_messaging,business_management,pages_read_engagement,public_profile,pages_messaging_phone_number,pages_messaging_subscriptions,pages_manage_metadata,pages_read_user_content,pages_manage_posts,pages_manage_engagement',
  VERIFY_TOKEN: process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN,
  REDIRECT_URL: process.env.FACEBOOK_REDIRECT_URL,
  EVENT_WEBHOOK: {
    USER_SEND_TEXT: 'user_send_text',
    USER_SEND_POSTBACK: 'user_send_postback',
  },
} as const;
