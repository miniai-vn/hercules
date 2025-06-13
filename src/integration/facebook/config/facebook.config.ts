export const FACEBOOK_CONFIG = {
  BASE_PATH_FACEBOOK: 'https://graph.facebook.com/v23.0/',
  FACEBOOK_PATH: 'https://www.facebook.com/v23.0/',
  APP: {
    ID: process.env.FACEBOOK_APP_ID || 'your_facebook_app_id',
    SECRET: process.env.FACEBOOK_APP_SECRET || 'your_facebook_app_secret',
  },
  ENDPOINT: {
    ME_ACCOUNTS: 'me/accounts',
    OAUTH_ACCESS_TOKEN: 'oauth/access_token',
    DIALOG_OAUTH: 'dialog/oauth',
  },
  SCOPE: 'pages_show_list,pages_messaging',
  REDIRECT_URI:
    'https://6bc4-115-73-215-92.ngrok-free.app/api/facebook/callback',
} as const;
