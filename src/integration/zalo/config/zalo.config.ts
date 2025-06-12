export const ZALO_CONFIG = {
  BASE_URL: 'https://openapi.zalo.me',
  ENDPOINTS: {
    SEND_MESSAGE: '/v2.0/oa/message',
    GET_USER_PROFILE: '/v2.0/oa/getprofile',
    UPLOAD_FILE: '/v2.0/oa/upload',
    GET_CONVERSATIONS: '/v2.0/oa/conversation',
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
  },
} as const;
