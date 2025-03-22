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
    
    try {
      await dbService.createHistoricalSnapshot();
      toast.success('Historical data snapshot created');
    } catch (error) {
      console.error('Failed to create historical snapshot:', error);
    }
    
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
        
      case 'fba-inbound-eligibility':
        return {
          asinInboundGuidance: Array.from({ length: 8 }, (_, i) => ({
            asin: `B0${100000 + i}`,
            inboundGuidance: ['INBOUND_NOT_RECOMMENDED', 'INBOUND_OK'][Math.floor(Math.random() * 2)],
            guidanceReasonList: ['SLOW_MOVING_ASIN']
          }))
        };
        
      case 'fba-inventory-age':
        return {
          inventoryAgeDetail: Array.from({ length: 10 }, (_, i) => ({
            sku: `SKU${100000 + i}`,
            fnSku: `FN${100000 + i}`,
            asin: `B0${100000 + i}`,
            totalQuantity: Math.floor(Math.random() * 100),
            inventoryAgeGroups: [
              { groupName: '0-90 days', quantity: Math.floor(Math.random() * 50) },
              { groupName: '91-180 days', quantity: Math.floor(Math.random() * 30) },
              { groupName: '181-270 days', quantity: Math.floor(Math.random() * 15) },
              { groupName: '271-365 days', quantity: Math.floor(Math.random() * 5) },
              { groupName: '>365 days', quantity: Math.floor(Math.random() * 2) }
            ]
          }))
        };
        
      case 'product-fees':
        return {
          feeDetails: Array.from({ length: 12 }, (_, i) => ({
            asin: `B0${100000 + i}`,
            sku: `SKU${100000 + i}`,
            feeBreakdown: [
              { feeType: 'FBA fees', amount: { currencyCode: 'USD', amount: (Math.random() * 3 + 1).toFixed(2) } },
              { feeType: 'Referral Fee', amount: { currencyCode: 'USD', amount: (Math.random() * 5 + 1).toFixed(2) } },
              { feeType: 'Closing Fee', amount: { currencyCode: 'USD', amount: '0.99' } }
            ],
            totalFees: { currencyCode: 'USD', amount: (Math.random() * 10 + 3).toFixed(2) }
          }))
        };
        
      case 'product-pricing':
        return {
          pricingData: Array.from({ length: 15 }, (_, i) => ({
            asin: `B0${100000 + i}`,
            sku: `SKU${100000 + i}`,
            itemPrice: { currencyCode: 'USD', amount: (Math.random() * 100 + 10).toFixed(2) },
            competitivePriceThreshold: { currencyCode: 'USD', amount: (Math.random() * 90 + 9).toFixed(2) },
            buyBoxPrice: { currencyCode: 'USD', amount: (Math.random() * 95 + 9.5).toFixed(2) }
          }))
        };
        
      case 'sales-analytics':
        return {
          analytics: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (30 - i) * 86400000).toISOString().split('T')[0],
            salesMetrics: {
              orderedUnits: Math.floor(Math.random() * 50),
              orderedProductSales: { currencyCode: 'USD', amount: (Math.random() * 1000 + 100).toFixed(2) },
              totalOrderItems: Math.floor(Math.random() * 60),
              averageSellingPrice: { currencyCode: 'USD', amount: (Math.random() * 50 + 15).toFixed(2) }
            }
          }))
        };
        
      case 'shipping':
        return {
          shipments: Array.from({ length: 8 }, (_, i) => ({
            shipmentId: `SHIP-${100000 + i}`,
            amazonOrderId: `ORDER-${100000 + i}`,
            trackingId: `TRACK-${100000 + i}`,
            status: ['SHIPPED', 'LABEL_PURCHASED', 'IN_TRANSIT'][Math.floor(Math.random() * 3)],
            createdDate: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString()
          }))
        };
        
      case 'seller-account':
        return {
          marketplaceParticipations: [
            {
              marketplace: {
                id: 'ATVPDKIKX0DER',
                name: 'Amazon.com',
                countryCode: 'US',
                defaultCurrencyCode: 'USD',
                defaultLanguageCode: 'en_US'
              },
              participation: {
                isParticipating: true,
                hasSuspendedListings: false
              }
            },
            {
              marketplace: {
                id: 'A2EUQ1WTGCTBG2',
                name: 'Amazon.ca',
                countryCode: 'CA',
                defaultCurrencyCode: 'CAD',
                defaultLanguageCode: 'en_CA'
              },
              participation: {
                isParticipating: false,
                hasSuspendedListings: false
              }
            }
          ]
        };
        
      case 'fulfillment-inbound':
        return {
          shipments: Array.from({ length: 6 }, (_, i) => ({
            shipmentId: `FBA-INB-${100000 + i}`,
            sellerSKU: `SKU${100000 + i}`,
            fulfillmentNetworkSKU: `FN${100000 + i}`,
            quantityShipped: Math.floor(Math.random() * 100) + 5,
            quantityReceived: Math.floor(Math.random() * 80),
            shipmentStatus: ['WORKING', 'SHIPPED', 'RECEIVING', 'CLOSED'][Math.floor(Math.random() * 4)],
            shipmentName: `Inbound Shipment ${i + 1}`
          }))
        };
        
      case 'fulfillment-outbound':
        return {
          fulfillmentOrders: Array.from({ length: 7 }, (_, i) => ({
            sellerFulfillmentOrderId: `FFO-${100000 + i}`,
            destinationAddress: {
              name: `Customer ${i + 1}`,
              addressLine1: `${1000 + i} Main St`,
              city: 'Seattle',
              stateOrRegion: 'WA',
              postalCode: '98101',
              countryCode: 'US'
            },
            fulfillmentAction: 'Ship',
            displayableOrderId: `ORDER-${100000 + i}`,
            displayableOrderDate: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
            statusUpdatedDate: new Date(Date.now() - Math.random() * 10 * 86400000).toISOString()
          }))
        };
        
      case 'notifications':
        return {
          destinations: Array.from({ length: 3 }, (_, i) => ({
            destinationId: `DEST-${100000 + i}`,
            resourceVersion: '1.0',
            name: `Notification Destination ${i + 1}`,
            destinationType: 'SQS'
          }))
        };
        
      case 'merchant-fulfillment':
        return {
          merchantShipments: Array.from({ length: 5 }, (_, i) => ({
            shipmentId: `MSH-${100000 + i}`,
            amazonOrderId: `ORDER-${100000 + i}`,
            sellerOrderId: `SO-${100000 + i}`,
            itemList: [
              {
                orderItemId: `ITEM-${100000 + i}`,
                quantity: Math.floor(Math.random() * 3) + 1
              }
            ],
            status: ['PURCHASED', 'CANCELLED', 'ERROR', 'SHIPPED'][Math.floor(Math.random() * 4)]
          }))
        };
        
      case 'feeds':
        return {
          feeds: Array.from({ length: 4 }, (_, i) => ({
            feedId: `FEED-${100000 + i}`,
            feedType: ['POST_PRODUCT_DATA', 'POST_INVENTORY_AVAILABILITY_DATA', 'POST_ORDER_FULFILLMENT_DATA'][Math.floor(Math.random() * 3)],
            processingStatus: ['CANCELLED', 'DONE', 'FATAL', 'IN_PROGRESS', 'IN_QUEUE'][Math.floor(Math.random() * 5)],
            createdTime: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString()
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
