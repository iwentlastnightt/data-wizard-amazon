
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { AmazonCredentials, ApiResponse, DatabaseStats } from '../types/amazon-api';

interface AmazonDB extends DBSchema {
  credentials: {
    key: 'amazon-credentials';
    value: AmazonCredentials;
  };
  responses: {
    key: string;
    value: ApiResponse;
    indexes: { 'by-endpoint': string; 'by-timestamp': number };
  };
}

class DatabaseService {
  private dbPromise: Promise<IDBPDatabase<AmazonDB>>;
  private DB_NAME = 'amazon-sp-api';
  private DB_VERSION = 1;

  constructor() {
    this.dbPromise = this.initDatabase();
  }

  private async initDatabase(): Promise<IDBPDatabase<AmazonDB>> {
    return openDB<AmazonDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Create a store for the Amazon SP-API credentials
        if (!db.objectStoreNames.contains('credentials')) {
          db.createObjectStore('credentials');
        }

        // Create a store for API responses with indexes
        if (!db.objectStoreNames.contains('responses')) {
          const responseStore = db.createObjectStore('responses', { 
            keyPath: 'id',
            autoIncrement: true 
          });
          responseStore.createIndex('by-endpoint', 'endpointId');
          responseStore.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }

  async saveCredentials(credentials: AmazonCredentials): Promise<void> {
    const db = await this.dbPromise;
    await db.put('credentials', credentials, 'amazon-credentials');
  }

  async getCredentials(): Promise<AmazonCredentials | undefined> {
    const db = await this.dbPromise;
    return db.get('credentials', 'amazon-credentials');
  }

  async saveResponse(response: ApiResponse): Promise<string> {
    const db = await this.dbPromise;
    const id = await db.put('responses', {
      ...response,
      id: `${response.endpointId}-${response.timestamp}`
    });
    return id.toString();
  }

  async getResponsesByEndpoint(endpointId: string): Promise<ApiResponse[]> {
    const db = await this.dbPromise;
    return db.getAllFromIndex('responses', 'by-endpoint', endpointId);
  }

  async getLatestResponseByEndpoint(endpointId: string): Promise<ApiResponse | undefined> {
    const db = await this.dbPromise;
    const responses = await db.getAllFromIndex('responses', 'by-endpoint', endpointId);
    if (responses.length === 0) return undefined;
    
    // Sort by timestamp descending and return the first one
    return responses.sort((a, b) => b.timestamp - a.timestamp)[0];
  }

  async getAllResponses(): Promise<ApiResponse[]> {
    const db = await this.dbPromise;
    return db.getAll('responses');
  }

  async getLatestResponses(): Promise<Record<string, ApiResponse>> {
    const db = await this.dbPromise;
    const responses = await db.getAll('responses');
    
    // Group by endpoint and get the latest for each
    const latestByEndpoint: Record<string, ApiResponse> = {};
    responses.forEach(response => {
      const current = latestByEndpoint[response.endpointId];
      if (!current || response.timestamp > current.timestamp) {
        latestByEndpoint[response.endpointId] = response;
      }
    });
    
    return latestByEndpoint;
  }

  async deleteResponsesByEndpoint(endpointId: string): Promise<void> {
    const db = await this.dbPromise;
    const responses = await db.getAllFromIndex('responses', 'by-endpoint', endpointId);
    const tx = db.transaction('responses', 'readwrite');
    
    for (const response of responses) {
      await tx.store.delete(response.id);
    }
    
    await tx.done;
  }

  async clearAllResponses(): Promise<void> {
    const db = await this.dbPromise;
    await db.clear('responses');
  }

  async getDatabaseStats(): Promise<DatabaseStats> {
    const db = await this.dbPromise;
    const responses = await db.getAll('responses');
    
    // Calculate the unique endpoints
    const endpoints = new Set(responses.map(r => r.endpointId));
    
    // Find the latest timestamp
    let latestTimestamp = null;
    if (responses.length > 0) {
      latestTimestamp = Math.max(...responses.map(r => r.timestamp));
    }
    
    // Estimate storage used (rough approximation)
    const storageUsed = responses.reduce((total, response) => {
      return total + JSON.stringify(response).length;
    }, 0);
    
    return {
      totalEndpoints: endpoints.size,
      totalResponses: responses.length,
      lastUpdated: latestTimestamp,
      storageUsed
    };
  }

  async exportAllData(): Promise<Blob> {
    const db = await this.dbPromise;
    const credentials = await db.get('credentials', 'amazon-credentials');
    const responses = await db.getAll('responses');
    
    const exportData = {
      credentials: credentials ? {
        clientId: credentials.clientId,
        // We redact the secret for security reasons in the export
        clientSecret: '********',
        refreshToken: '********'
      } : null,
      responses
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    
    return blob;
  }
}

// Create a singleton instance
const dbService = new DatabaseService();
export default dbService;
