
export interface AmazonCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export interface ApiEndpoint {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  requiresParams: boolean;
  defaultParams?: Record<string, any>;
}

export interface ApiResponse {
  endpointId: string;
  data: any;
  timestamp: number;
  success: boolean;
  error?: string;
  id?: string; // Add the id field that's used in the database service
}

export interface DatabaseStats {
  totalEndpoints: number;
  totalResponses: number;
  lastUpdated: number | null;
  storageUsed: number;
  historicalSnapshots: number;
}

export interface ProgressStatus {
  currentEndpoint: string;
  progress: number;
  total: number;
  status: 'idle' | 'running' | 'completed' | 'error';
  message?: string;
}

export interface HistoricalSnapshot {
  id: string;
  date: number;
  responseIds: string[];
}

export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'listings-items',
    name: 'Listings Items',
    description: 'Get detailed information about your Amazon listings',
    endpoint: '/listings/2021-08-01/items',
    requiresParams: false
  },
  {
    id: 'orders',
    name: 'Orders',
    description: 'Get order information from Amazon',
    endpoint: '/orders/v0/orders',
    requiresParams: true,
    defaultParams: {
      MarketplaceIds: ['ATVPDKIKX0DER'], // US marketplace
      CreatedAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // Last 30 days
    }
  },
  {
    id: 'finances',
    name: 'Finances',
    description: 'Get financial information about your Amazon account',
    endpoint: '/finances/v0/financialEvents',
    requiresParams: false
  },
  {
    id: 'inventory',
    name: 'Inventory',
    description: 'Get inventory information',
    endpoint: '/fba/inventory/v1/summaries',
    requiresParams: true,
    defaultParams: {
      granularityType: 'Marketplace',
      granularityId: 'ATVPDKIKX0DER' // US marketplace
    }
  },
  {
    id: 'catalog-items',
    name: 'Catalog Items',
    description: 'Search for items in the Amazon catalog',
    endpoint: '/catalog/v0/items',
    requiresParams: true,
    defaultParams: {
      MarketplaceId: 'ATVPDKIKX0DER', // US marketplace
      IncludeQuantity: true,
    }
  },
  {
    id: 'reports',
    name: 'Reports',
    description: 'Get report information from Amazon',
    endpoint: '/reports/2021-06-30/reports',
    requiresParams: true,
    defaultParams: {
      reportTypes: ['GET_FLAT_FILE_OPEN_LISTINGS_DATA']
    }
  },
  // Adding additional SP-API endpoints
  {
    id: 'fba-inbound-eligibility',
    name: 'FBA Inbound Eligibility',
    description: 'Check FBA inbound eligibility for products',
    endpoint: '/fba/inbound/v1/eligibility/inbound',
    requiresParams: true,
    defaultParams: {
      MarketplaceIds: ['ATVPDKIKX0DER'], // US marketplace
    }
  },
  {
    id: 'fba-inventory-age',
    name: 'FBA Inventory Age',
    description: 'Get FBA inventory age information',
    endpoint: '/fba/inventory/v1/inventory/summaries',
    requiresParams: true,
    defaultParams: {
      details: true,
      granularityType: 'Marketplace',
      granularityId: 'ATVPDKIKX0DER' // US marketplace
    }
  },
  {
    id: 'product-fees',
    name: 'Product Fees',
    description: 'Get Amazon fees for products',
    endpoint: '/products/fees/v0/listings/2020-12-01/items/fees',
    requiresParams: true,
    defaultParams: {
      MarketplaceId: 'ATVPDKIKX0DER' // US marketplace
    }
  },
  {
    id: 'product-pricing',
    name: 'Product Pricing',
    description: 'Get pricing information for products',
    endpoint: '/products/pricing/v0/price',
    requiresParams: true,
    defaultParams: {
      MarketplaceId: 'ATVPDKIKX0DER' // US marketplace
    }
  },
  {
    id: 'sales-analytics',
    name: 'Sales Analytics',
    description: 'Get sales analytics data',
    endpoint: '/sales/v1/orderMetrics',
    requiresParams: true,
    defaultParams: {
      marketplaceIds: ['ATVPDKIKX0DER'],
      interval: 'DAY',
      granularity: 'TOTAL',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString()
    }
  },
  {
    id: 'shipping',
    name: 'Shipping',
    description: 'Get shipping information',
    endpoint: '/shipping/v1/shipments',
    requiresParams: true,
    defaultParams: {
      marketplaceId: 'ATVPDKIKX0DER',
      limit: 20
    }
  },
  {
    id: 'seller-account',
    name: 'Seller Account',
    description: 'Get seller account information',
    endpoint: '/sellers/v1/marketplaceParticipations',
    requiresParams: false
  },
  {
    id: 'fulfillment-inbound',
    name: 'Fulfillment Inbound',
    description: 'Get inbound shipment data',
    endpoint: '/fba/inbound/v0/shipments',
    requiresParams: true,
    defaultParams: {
      ShipmentStatusList: ['WORKING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CHECKED_IN', 'RECEIVING', 'CLOSED', 'CANCELLED'],
      QueryType: 'SHIPMENT'
    }
  },
  {
    id: 'fulfillment-outbound',
    name: 'Fulfillment Outbound',
    description: 'Get outbound fulfillment data',
    endpoint: '/fba/outbound/v0/fulfillments/orders',
    requiresParams: true,
    defaultParams: {
      MarketplaceId: 'ATVPDKIKX0DER',
      limit: 20
    }
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Get notifications from Amazon',
    endpoint: '/notifications/v1/destinations',
    requiresParams: false
  },
  {
    id: 'merchant-fulfillment',
    name: 'Merchant Fulfillment',
    description: 'Get merchant fulfillment shipping data',
    endpoint: '/mfn/v0/shipments',
    requiresParams: true,
    defaultParams: {
      MarketplaceId: 'ATVPDKIKX0DER',
      ShipmentStatusList: ['WORKING', 'SHIPPED']
    }
  },
  {
    id: 'feeds',
    name: 'Feeds',
    description: 'Get Amazon feed information',
    endpoint: '/feeds/2021-06-30/feeds',
    requiresParams: true,
    defaultParams: {
      feedTypes: ['POST_PRODUCT_DATA']
    }
  }
];
