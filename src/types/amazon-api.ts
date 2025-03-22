
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
}

export interface ProgressStatus {
  currentEndpoint: string;
  progress: number;
  total: number;
  status: 'idle' | 'running' | 'completed' | 'error';
  message?: string;
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
  }
];
