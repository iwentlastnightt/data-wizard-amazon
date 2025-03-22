
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HistoricalSnapshot, ApiResponse } from '@/types/amazon-api';
import { DataPreview } from './DataPreview';
import dbService from '@/services/db-service';
import { Calendar, Clock } from 'lucide-react';

interface HistoricalDataViewProps {
  className?: string;
}

export function HistoricalDataView({ className }: HistoricalDataViewProps) {
  const [snapshots, setSnapshots] = useState<HistoricalSnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<HistoricalSnapshot | null>(null);
  const [snapshotResponses, setSnapshotResponses] = useState<Record<string, ApiResponse>>({});
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSnapshots = async () => {
      try {
        setIsLoading(true);
        const historicalSnapshots = await dbService.getHistoricalSnapshots();
        setSnapshots(historicalSnapshots);
        
        if (historicalSnapshots.length > 0) {
          setSelectedSnapshot(historicalSnapshots[0]);
        }
      } catch (error) {
        console.error('Failed to load historical snapshots:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSnapshots();
  }, []);
  
  useEffect(() => {
    const loadSnapshotData = async () => {
      if (!selectedSnapshot) return;
      
      try {
        setIsLoading(true);
        const responses = await dbService.getSnapshotResponses(selectedSnapshot);
        setSnapshotResponses(responses);
        
        if (Object.keys(responses).length > 0 && !selectedEndpoint) {
          setSelectedEndpoint(Object.keys(responses)[0]);
        }
      } catch (error) {
        console.error('Failed to load snapshot data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSnapshotData();
  }, [selectedSnapshot]);
  
  const handleSnapshotChange = (value: string) => {
    const snapshot = snapshots.find(s => s.id === value);
    if (snapshot) {
      setSelectedSnapshot(snapshot);
      setSelectedEndpoint(null);
    }
  };
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString() + ' ' + 
           new Date(timestamp).toLocaleTimeString();
  };
  
  if (snapshots.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Historical Data</h3>
            <p className="text-gray-500">
              Historical snapshots are created when you log in. Come back after you've used the app for a while.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Calendar className="mr-2 h-5 w-5" />
          Historical Data View
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Select
            value={selectedSnapshot?.id}
            onValueChange={handleSnapshotChange}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a snapshot" />
            </SelectTrigger>
            <SelectContent>
              {snapshots.map((snapshot) => (
                <SelectItem key={snapshot.id} value={snapshot.id}>
                  {formatDate(snapshot.date)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedSnapshot && (
          <div className="space-y-4">
            <Tabs defaultValue="endpoints" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="endpoints" className="flex-1">Endpoints</TabsTrigger>
                <TabsTrigger value="data" className="flex-1">Data View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="endpoints">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {Object.entries(snapshotResponses).map(([endpointId, response]) => (
                    <Card 
                      key={endpointId} 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => setSelectedEndpoint(endpointId)}
                    >
                      <CardContent className="p-4">
                        <div className="font-medium">{response.endpointId}</div>
                        <div className="text-sm text-gray-500">
                          Last updated: {formatDate(response.timestamp)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="data">
                {selectedEndpoint && snapshotResponses[selectedEndpoint] ? (
                  <DataPreview response={snapshotResponses[selectedEndpoint]} />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Select an endpoint to view data
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
