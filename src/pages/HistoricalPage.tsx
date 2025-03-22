
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { HistoricalDataView } from '@/components/ui-components/HistoricalDataView';
import { DatabaseStats } from '@/types/amazon-api';
import amazonService from '@/services/amazon-service';
import dbService from '@/services/db-service';
import { Database, History, LayoutDashboard } from 'lucide-react';

export default function HistoricalPage() {
  const navigate = useNavigate();
  const [dbStats, setDbStats] = useState<DatabaseStats>({
    totalEndpoints: 0,
    totalResponses: 0,
    lastUpdated: null,
    storageUsed: 0,
    historicalSnapshots: 0
  });
  
  useEffect(() => {
    const checkCredentials = async () => {
      const hasCredentials = amazonService.hasCredentials();
      if (!hasCredentials) {
        navigate('/credentials');
      }
    };
    
    checkCredentials();
  }, [navigate]);
  
  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await dbService.getDatabaseStats();
        setDbStats(stats);
      } catch (error) {
        console.error('Failed to load database stats:', error);
      }
    };
    
    loadStats();
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-8">
      <header className="sticky top-0 z-40 w-full bg-white/70 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Amazon SP-API Data Extractor</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button variant="outline" size="sm" className="font-medium">
              <History className="h-4 w-4 mr-2" />
              Historical Data
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 pt-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Historical Data</h2>
          <p className="text-gray-500">
            View historical snapshots of your Amazon data. Each snapshot represents data from all endpoints at a specific point in time.
          </p>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium">Total Snapshots:</span> {dbStats.historicalSnapshots}
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
        
        <HistoricalDataView className="mb-6" />
      </main>
    </div>
  );
}
