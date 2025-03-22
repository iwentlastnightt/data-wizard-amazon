
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { API_ENDPOINTS, ApiEndpoint, ApiResponse, DatabaseStats, ProgressStatus } from '@/types/amazon-api';
import amazonService from '@/services/amazon-service';
import dbService from '@/services/db-service';
import { toast } from 'sonner';
import { AnimatedNumber } from '@/components/ui-components/AnimatedNumber';
import { EndpointCard } from '@/components/ui-components/EndpointCard';
import { DataPreview } from '@/components/ui-components/DataPreview';
import { AlertTriangle, ChevronRight, Database, Download, LayoutDashboard, RefreshCcw, Settings, Play, Clock } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [responses, setResponses] = useState<Record<string, ApiResponse>>({});
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [progress, setProgress] = useState<ProgressStatus>({
    currentEndpoint: '',
    progress: 0,
    total: 0,
    status: 'idle'
  });
  const [dbStats, setDbStats] = useState<DatabaseStats>({
    totalEndpoints: 0,
    totalResponses: 0,
    lastUpdated: null,
    storageUsed: 0
  });
  
  // Check if credentials are set
  useEffect(() => {
    const checkCredentials = async () => {
      const hasCredentials = amazonService.hasCredentials();
      if (!hasCredentials) {
        toast.warning('Amazon SP-API credentials are not set', {
          description: 'Please set your credentials to access Amazon data',
          action: {
            label: 'Set Credentials',
            onClick: () => navigate('/credentials')
          }
        });
      }
    };
    
    checkCredentials();
  }, [navigate]);
  
  // Load data from the database
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const latestResponses = await dbService.getLatestResponses();
        setResponses(latestResponses);
        
        // Set the first endpoint as selected, or use existing selection
        if (Object.keys(latestResponses).length > 0 && !selectedEndpoint) {
          setSelectedEndpoint(Object.keys(latestResponses)[0]);
        }
        
        // Load database stats
        const stats = await dbService.getDatabaseStats();
        setDbStats(stats);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load data from the database');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [selectedEndpoint]);
  
  // Set up progress listener
  useEffect(() => {
    const unsubscribe = amazonService.onProgressUpdate((status) => {
      setProgress(status);
      if (status.status === 'completed') {
        setIsFetching(false);
      }
    });
    
    return unsubscribe;
  }, []);
  
  const handleFetchData = async (endpoint: ApiEndpoint) => {
    try {
      const response = await amazonService.fetchFromEndpoint(endpoint);
      
      // Update the responses state
      setResponses(prev => ({
        ...prev,
        [endpoint.id]: response
      }));
      
      // Select this endpoint to show its data
      setSelectedEndpoint(endpoint.id);
      
      // Refresh database stats
      const stats = await dbService.getDatabaseStats();
      setDbStats(stats);
      
      return response;
    } catch (error) {
      console.error(`Failed to fetch data from ${endpoint.id}:`, error);
      toast.error(`Failed to fetch data from ${endpoint.name}`);
      throw error;
    }
  };
  
  const handleFetchAllData = async () => {
    if (isFetching) return;
    
    setIsFetching(true);
    try {
      const results = await amazonService.fetchAllEndpoints();
      setResponses(results);
      
      // Refresh database stats
      const stats = await dbService.getDatabaseStats();
      setDbStats(stats);
      
      toast.success('Successfully fetched data from all endpoints');
    } catch (error) {
      console.error('Failed to fetch all data:', error);
      toast.error('Failed to fetch data from all endpoints');
    }
  };
  
  const exportData = async () => {
    try {
      const blob = await dbService.exportAllData();
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `amazon-sp-api-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error('Failed to export data');
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/70 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Amazon SP-API Data Extractor</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/setup')}>
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/credentials')}>
              <Database className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto px-4 pt-6">
        {/* Progress bar for fetching all data */}
        {progress.status === 'running' && (
          <Card className="mb-6 glass border-opacity-30">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{progress.currentEndpoint}</span>
                  <span>{progress.progress} of {progress.total}</span>
                </div>
                <Progress value={(progress.progress / progress.total) * 100} />
                <p className="text-sm text-gray-500 dark:text-gray-400">{progress.message}</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="glass glass-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Endpoints</CardTitle>
              <CardDescription>Total available data endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                <AnimatedNumber value={API_ENDPOINTS.length} />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass glass-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Data Points</CardTitle>
              <CardDescription>Total responses stored</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                <AnimatedNumber value={dbStats.totalResponses} />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass glass-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Last Updated</CardTitle>
              <CardDescription>Time since last data fetch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold flex items-center">
                {dbStats.lastUpdated ? (
                  <>
                    <Clock className="mr-2 h-6 w-6 text-gray-400" />
                    {new Date(dbStats.lastUpdated).toLocaleString()}
                  </>
                ) : (
                  <span>Never</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Button
            onClick={handleFetchAllData}
            disabled={isFetching || isLoading}
            className="flex items-center space-x-2"
          >
            <Play className="h-4 w-4 mr-2" />
            Fetch All Data
          </Button>
          
          <Button
            variant="outline"
            onClick={exportData}
            disabled={isLoading || dbStats.totalResponses === 0}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
        
        {/* Main tabs */}
        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full max-w-md mb-6">
            <TabsTrigger value="dashboard" className="flex items-center">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Data View
            </TabsTrigger>
          </TabsList>
          
          {/* Dashboard tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* API endpoints grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {API_ENDPOINTS.map((endpoint) => (
                <EndpointCard
                  key={endpoint.id}
                  endpoint={endpoint}
                  response={responses[endpoint.id]}
                  onFetch={() => handleFetchData(endpoint)}
                  isLoading={isLoading}
                />
              ))}
            </div>
          </TabsContent>
          
          {/* Data view tab */}
          <TabsContent value="data" className="space-y-6">
            {dbStats.totalResponses === 0 ? (
              <Card className="glass">
                <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px]">
                  <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
                    You haven't fetched any data yet. Go to the Dashboard tab and click "Fetch All Data" to start.
                  </p>
                  <Button onClick={() => setActiveTab('dashboard')}>
                    Go to Dashboard
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Endpoint selector */}
                <div className="flex flex-wrap gap-2">
                  {Object.keys(responses).map((endpointId) => (
                    <Button
                      key={endpointId}
                      variant={selectedEndpoint === endpointId ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedEndpoint(endpointId)}
                      className="mb-2"
                    >
                      {API_ENDPOINTS.find(e => e.id === endpointId)?.name || endpointId}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ))}
                </div>
                
                {/* Data preview */}
                {selectedEndpoint && responses[selectedEndpoint] && (
                  <DataPreview response={responses[selectedEndpoint]} />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
