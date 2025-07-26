export const ZALO_CONFIG = {
  BASE_URL: 'https://openapi.zalo.me',
  OAUTH_BASE_URL: 'https://oauth.zaloapp.com',
  ENDPOINTS: {
    SEND_MESSAGE: '/v3.0/oa/message/cs',
    GET_USER_LIST: '/v3.0/oa/user/getlist',
    GET_USER_PROFILE: '/v3.0/oa/user/detail',
    UPLOAD_FILE: '/v2.0/oa/upload',
    GET_CONVERSATIONS: '/v2.0/oa/conversation',
    GET_OA_INFO: '/v2.0/oa/getoa',
    LIST_RECENT_CHAT: '/v2.0/oa/listrecentchat',
    GET_TAGS: '/v2.0/oa/tag/gettagsofoa',
  },
  OAUTH_ENDPOINTS: {
    ACCESS_TOKEN: '/v4/oa/access_token',
    REFRESH_TOKEN: '/v4/oa/refresh_token',
  },
  WEBHOOK_EVENTS: {
    USER_SEND_TEXT: 'user_send_text',
    USER_SEND_IMAGE: 'user_send_image',
    USER_SEND_FILE: 'user_send_file',
    USER_SEND_STICKER: 'user_send_sticker',
    USER_SEND_AUDIO: 'user_send_audio',
    USER_SEND_VIDEO: 'user_send_video',
    USER_SEND_LOCATION: 'user_send_location',
    USER_SUBMIT_INFO: 'user_submit_info',
    USER_CLICK_CHABOT_MENU: 'user_click_chabot_menu',
    USER_SEEN_MESSAGE: 'user_seen_message',
    // OA
    OA_SEND_TEXT: 'oa_send_text',
  },
} as const;
