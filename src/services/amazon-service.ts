import { AmazonCredentials, ApiEndpoint, ApiResponse, ProgressStatus } from '../types/amazon-api';
import dbService from './db-service';
import { toast } from 'sonner';

class AmazonService {
  private proxyUrl = 'http://localhost:8080/api/amazon';
  private credentials: AmazonCredentials | null = null;
  private accessToken: string | null = null;
  private tokenExpiration: number = 0;
  private progressStatus: ProgressStatus = {
    currentEndpoint: '',
    progress: 0,
    total: 0,
    status: 'idle'
  };
  private progressListeners: ((status: ProgressStatus) => void)[] = [];

  constructor() {
    this.initializeCredentials();
  }

  private async initializeCredentials() {
    try {
      const credentials = await dbService.getCredentials();
      if (credentials) {
        this.credentials = credentials;
      }
    } catch (error) {
      console.error('Failed to initialize credentials:', error);
    }
  }

  public async setCredentials(credentials: AmazonCredentials): Promise<boolean> {
    try {
      const isValid = await this.validateCredentials(credentials);
      
      if (isValid) {
        await dbService.saveCredentials(credentials);
        this.credentials = credentials;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to set credentials:', error);
      return false;
    }
  }

  private async validateCredentials(credentials: AmazonCredentials): Promise<boolean> {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return !!(credentials.clientId && credentials.clientSecret && credentials.refreshToken);
    } catch (error) {
      console.error('Credential validation failed:', error);
      return false;
    }
  }

  public hasCredentials(): boolean {
    return !!this.credentials;
  }

  private async getAccessToken(): Promise<string> {
    if (!this.credentials) {
      throw new Error('Credentials not set');
    }

    if (this.accessToken && Date.now() < this.tokenExpiration - 60000) {
      return this.accessToken;
    }

    await new Promise(resolve => setTimeout(resolve, 800));
    
    this.accessToken = 'simulated-access-token-' + Date.now();
    this.tokenExpiration = Date.now() + 3600000;
    
    return this.accessToken;
  }

  public async fetchFromEndpoint(endpoint: ApiEndpoint, params?: Record<string, any>): Promise<ApiResponse> {
    try {
      if (!this.credentials) {
        throw new Error('Credentials not set');
      }

      const accessToken = await this.getAccessToken();
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const response: ApiResponse = {
        endpointId: endpoint.id,
        data: this.generateMockData(endpoint.id),
        timestamp: Date.now(),
        success: true
      };
      
      await dbService.saveResponse(response);
      
      return response;
    } catch (error) {
      console.error(`Error fetching from endpoint ${endpoint.id}:`, error);
      
      const errorResponse: ApiResponse = {
        endpointId: endpoint.id,
        data: null,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      await dbService.saveResponse(errorResponse);
      
      return errorResponse;
    }
  }

  public async fetchAllEndpoints(): Promise<Record<string, ApiResponse>> {
    const endpoints = await import('../types/amazon-api').then(module => module.API_ENDPOINTS);
    
    this.updateProgress({
      currentEndpoint: '',
      progress: 0,
      total: endpoints.length,
      status: 'running',
      message: 'Starting data extraction...'
    });

    const results: Record<string, ApiResponse> = {};
    
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      
      this.updateProgress({
        currentEndpoint: endpoint.name,
        progress: i,
        total: endpoints.length,
        status: 'running',
        message: `Fetching data from ${endpoint.name}...`
      });
      
      try {
        const params = endpoint.requiresParams ? endpoint.defaultParams : undefined;
        const response = await this.fetchFromEndpoint(endpoint, params);
        results[endpoint.id] = response;
        
        if (response.success) {
          toast.success(`Successfully fetched data from ${endpoint.name}`);
        } else {
          toast.error(`Failed to fetch data from ${endpoint.name}`);
        }
      } catch (error) {
        console.error(`Failed to fetch from ${endpoint.id}:`, error);
        results[endpoint.id] = {
          endpointId: endpoint.id,
          data: null,
          timestamp: Date.now(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        toast.error(`Error: Failed to fetch from ${endpoint.name}`);
      }
    }
    
    this.updateProgress({
      currentEndpoint: '',
      progress: endpoints.length,
      total: endpoints.length,
      status: 'completed',
      message: 'All data has been extracted'
    });
    
    return results;
  }

  private generateMockData(endpointId: string): any {
    switch (endpointId) {
      case 'listings-items':
        return {
          items: Array.from({ length: 15 }, (_, i) => ({
            sku: `SKU${100000 + i}`,
            asin: `B0${100000 + i}`,
            title: `Product ${i + 1}`,
            price: (Math.random() * 100 + 10).toFixed(2),
            condition: 'New',
            quantity: Math.floor(Math.random() * 100)
          }))
        };
        
      case 'orders':
        return {
          orders: Array.from({ length: 10 }, (_, i) => ({
            orderId: `ORDER-${100000 + i}`,
            purchaseDate: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
            orderStatus: ['Shipped', 'Delivered', 'Processing'][Math.floor(Math.random() * 3)],
            orderTotal: {
              currencyCode: 'USD',
              amount: (Math.random() * 500 + 20).toFixed(2)
            },
            shipmentStatus: ['Shipped', 'Pending', 'Delivered'][Math.floor(Math.random() * 3)]
          }))
        };
        
      case 'finances':
        return {
          financialEvents: {
            shipmentEvents: Array.from({ length: 8 }, (_, i) => ({
              amazonOrderId: `ORDER-${100000 + i}`,
              postedDate: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
              shipmentItemList: Array.from({ length: 2 }, (_, j) => ({
                itemChargeList: [{
                  chargeType: 'Principal',
                  chargeAmount: {
                    currencyCode: 'USD',
                    amount: (Math.random() * 100 + 10).toFixed(2)
                  }
                }]
              }))
            }))
          }
        };
        
      case 'inventory':
        return {
          inventories: Array.from({ length: 12 }, (_, i) => ({
            sku: `SKU${100000 + i}`,
            fnSku: `FN${100000 + i}`,
            asin: `B0${100000 + i}`,
            condition: 'New',
            totalQuantity: Math.floor(Math.random() * 100)
          }))
        };
        
      case 'catalog-items':
        return {
          items: Array.from({ length: 20 }, (_, i) => ({
            asin: `B0${100000 + i}`,
            attributes: {
              title: `Amazon Product ${i + 1}`,
              manufacturer: ['Amazon', 'Apple', 'Samsung', 'Sony'][Math.floor(Math.random() * 4)],
              brand: ['AmazonBasics', 'Apple', 'Samsung', 'Sony'][Math.floor(Math.random() * 4)],
              dimensions: {
                height: { value: (Math.random() * 10 + 1).toFixed(1), unit: 'inches' },
                width: { value: (Math.random() * 10 + 1).toFixed(1), unit: 'inches' },
                length: { value: (Math.random() * 10 + 1).toFixed(1), unit: 'inches' },
                weight: { value: (Math.random() * 5 + 0.5).toFixed(1), unit: 'pounds' }
              }
            }
          }))
        };
        
      case 'reports':
        return {
          reports: Array.from({ length: 5 }, (_, i) => ({
            reportId: `REPORT-${100000 + i}`,
            reportType: ['GET_FLAT_FILE_OPEN_LISTINGS_DATA', 'GET_MERCHANT_LISTINGS_DATA', 'GET_FBA_INVENTORY_AGED_DATA'][Math.floor(Math.random() * 3)],
            createdTime: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
            processingStatus: ['DONE', 'IN_PROGRESS', 'IN_QUEUE'][Math.floor(Math.random() * 3)]
          }))
        };
        
      default:
        return { message: 'Mock data for this endpoint is not implemented' };
    }
  }

  private updateProgress(status: ProgressStatus) {
    this.progressStatus = status;
    this.notifyProgressListeners();
  }

  private notifyProgressListeners() {
    this.progressListeners.forEach(listener => {
      listener(this.progressStatus);
    });
  }

  public onProgressUpdate(callback: (status: ProgressStatus) => void): () => void {
    this.progressListeners.push(callback);
    
    return () => {
      this.progressListeners = this.progressListeners.filter(listener => listener !== callback);
    };
  }

  public getProgressStatus(): ProgressStatus {
    return this.progressStatus;
  }
}

const amazonService = new AmazonService();
export default amazonService;
