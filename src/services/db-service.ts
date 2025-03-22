
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { AmazonCredentials, ApiResponse, DatabaseStats, HistoricalSnapshot } from '../types/amazon-api';

interface AmazonDB extends DBSchema {
  credentials: {
    key: 'amazon-credentials';
    value: AmazonCredentials;
  };
  responses: {
    key: string;
    value: ApiResponse & { id: string }; // Ensure the stored value has an id
    indexes: { 'by-endpoint': string; 'by-timestamp': number };
  };
  historical: {
    key: string;
    value: HistoricalSnapshot;
    indexes: { 'by-date': number };
  };
  lastLogin: {
    key: 'last-login';
    value: number;
  };
}

class DatabaseService {
  private dbPromise: Promise<IDBPDatabase<AmazonDB>>;
  private DB_NAME = 'amazon-sp-api';
  private DB_VERSION = 2; // Increment DB version to trigger upgrade

  constructor() {
    this.dbPromise = this.initDatabase();
  }

  private async initDatabase(): Promise<IDBPDatabase<AmazonDB>> {
    return openDB<AmazonDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
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

        // Create a store for historical data snapshots
        if (!db.objectStoreNames.contains('historical')) {
          const historicalStore = db.createObjectStore('historical', {
            keyPath: 'id',
            autoIncrement: true
          });
          historicalStore.createIndex('by-date', 'date');
        }

        // Create a store for tracking last login
        if (!db.objectStoreNames.contains('lastLogin')) {
          db.createObjectStore('lastLogin');
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
    const responseId = `${response.endpointId}-${response.timestamp}`;
    const id = await db.put('responses', {
      ...response,
      id: responseId
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
      // Now TypeScript knows response has an id property
      await tx.store.delete(response.id!); // Use non-null assertion since we know it exists
    }
    
    await tx.done;
  }

  async clearAllResponses(): Promise<void> {
    const db = await this.dbPromise;
    await db.clear('responses');
  }

  // Historical data methods
  async createHistoricalSnapshot(): Promise<string> {
    const db = await this.dbPromise;
    const latestResponses = await this.getLatestResponses();
    const responseIds = Object.values(latestResponses).map(response => response.id!);
    
    const snapshot: HistoricalSnapshot = {
      id: `snapshot-${Date.now()}`,
      date: Date.now(),
      responseIds
    };
    
    const id = await db.put('historical', snapshot);
    return id.toString();
  }

  async getHistoricalSnapshots(): Promise<HistoricalSnapshot[]> {
    const db = await this.dbPromise;
    return db.getAllFromIndex('historical', 'by-date').then(snapshots => 
      snapshots.sort((a, b) => b.date - a.date)
    );
  }

  async getSnapshotResponses(snapshot: HistoricalSnapshot): Promise<Record<string, ApiResponse>> {
    const db = await this.dbPromise;
    const responses: Record<string, ApiResponse> = {};
    
    for (const responseId of snapshot.responseIds) {
      const response = await db.get('responses', responseId);
      if (response) {
        responses[response.endpointId] = response;
      }
    }
    
    return responses;
  }

  // Last login tracking
  async updateLastLogin(): Promise<void> {
    const db = await this.dbPromise;
    await db.put('lastLogin', Date.now(), 'last-login');
  }

  async getLastLogin(): Promise<number | undefined> {
    const db = await this.dbPromise;
    return db.get('lastLogin', 'last-login');
  }

  async getDatabaseStats(): Promise<DatabaseStats> {
    const db = await this.dbPromise;
    const responses = await db.getAll('responses');
    const snapshots = await db.getAll('historical');
    
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
      storageUsed,
      historicalSnapshots: snapshots.length
    };
  }

  async exportAllData(): Promise<Blob> {
    const db = await this.dbPromise;
    const credentials = await db.get('credentials', 'amazon-credentials');
    const responses = await db.getAll('responses');
    const snapshots = await db.getAll('historical');
    const lastLogin = await db.get('lastLogin', 'last-login');
    
    const exportData = {
      credentials: credentials ? {
        clientId: credentials.clientId,
        // We redact the secret for security reasons in the export
        clientSecret: '********',
        refreshToken: '********'
      } : null,
      responses,
      snapshots,
      lastLogin
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
