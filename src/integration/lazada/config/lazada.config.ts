export const LAZADA_CONFIG = {
  BASE_URL: 'https://api.lazada.com',
  SANDBOX_URL: 'https://api.lazada.com/rest',
  ENDPOINTS: {
    // Product Management
    GET_PRODUCTS: '/products/get',
    CREATE_PRODUCT: '/product/create',
    UPDATE_PRODUCT: '/product/update',
    REMOVE_PRODUCT: '/product/remove',
    GET_PRODUCT: '/product/item/get',

    // Order Management
    GET_ORDERS: '/orders/get',
    GET_ORDER: '/order/get',
    GET_ORDER_ITEMS: '/order/items/get',
    SET_INVOICE_NUMBER: '/order/invoice_number/set',

    // Inventory Management
    UPDATE_PRICE_QUANTITY: '/product/price_quantity/update',
    GET_SELLABLE_QUANTITY: '/stock/sellable/get',

    // Category Management
    GET_CATEGORY_TREE: '/category/tree/get',
    GET_CATEGORY_ATTRIBUTES: '/category/attributes/get',

    // Brand Management
    GET_BRANDS: '/category/brands/query',

    // Logistics
    GET_SHIPMENT_PROVIDERS: '/logistics/shipment/providers/get',

    // Finance
    GET_TRANSACTIONS: '/finance/transaction/details/get',
    GET_PAYOUT_STATUS: '/finance/payout/status/get',

    // Seller Performance
    GET_METRICS: '/seller/performance/get',

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
  ORDER_STATUS: {
    UNPAID: 'unpaid',
    PENDING: 'pending',
    PAID: 'paid',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELED: 'canceled',
    RETURNED: 'returned',
    REFUNDED: 'refunded',
  },
  PRODUCT_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    DELETED: 'deleted',
  },
} as const;
