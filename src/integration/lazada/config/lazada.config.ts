export const LAZADA_CONFIG = {
  APP_KEY: process.env.LAZADA_APP_KEY,
  APP_SECRET: process.env.LAZADA_APP_SECRET,
  BASE_URL: 'https://api.lazada.vn/rest',
  AUTH_URL: 'https://api.lazada.com/rest',
  ENDPOINTS: {
    // im
    GET_MESSAGES: 'im/message/list',
    GET_SESSION_LIST: 'im/session/list',
    GET_SESSION_DETAIL: 'im/session/detail',
    OPEN_SESSION: 'im/session/open',
    MESSAGE_RECALL: 'im/message/recall',
    READ_SESSION: 'im/session/read',
    SEND_MESSAGE: 'im/message/send',

    // Webhook
    SET_WEBHOOK: '/webhook/set',
    GET_WEBHOOK: '/webhook/get',
  },
  WEBHOOK_EVENTS: {
    ORDER_CREATED: 'onOrderCreate',
    ORDER_UPDATED: 'onOrderStatusChange',
    ORDER_PAID: 'onOrderPaid',
    PRODUCT_CREATED: 'onProductCreate',
    PRODUCT_UPDATED: 'onProductUpdate',
    INVENTORY_UPDATED: 'onInventoryUpdate',
    SHIPMENT_STATUS_CHANGED: 'onShipmentStatusChange',
  },
} as const;
