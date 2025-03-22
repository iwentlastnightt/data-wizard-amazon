
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiEndpoint, ApiResponse } from '@/types/amazon-api';
import { Clock, Database, RefreshCcw } from 'lucide-react';

interface EndpointCardProps {
  endpoint: ApiEndpoint;
  response?: ApiResponse;
  onFetch: (endpoint: ApiEndpoint) => Promise<ApiResponse>;
  isLoading?: boolean;
}

export function EndpointCard({ endpoint, response, onFetch, isLoading }: EndpointCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleFetch = async () => {
    setIsRefreshing(true);
    try {
      await onFetch(endpoint);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const getStatusBadge = () => {
    if (!response) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-500">No Data</Badge>;
    }
    
    if (!response.success) {
      return <Badge variant="destructive">Error</Badge>;
    }
    
    return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Success</Badge>;
  };
  
  const formattedDate = response?.timestamp 
    ? new Date(response.timestamp).toLocaleString() 
    : 'Never';
  
  return (
    <Card className="glass glass-hover overflow-hidden transition-all duration-300 h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{endpoint.name}</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription className="text-sm">{endpoint.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : (
          <div className="text-sm">
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-2">
              <Clock className="h-3.5 w-3.5" />
              <span>Last Updated: {formattedDate}</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <Database className="h-3.5 w-3.5" />
              {response ? (
                <span>Data Size: {JSON.stringify(response.data).length.toLocaleString()} bytes</span>
              ) : (
                <span>No data available</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleFetch}
          disabled={isRefreshing || isLoading}
        >
          {isRefreshing ? (
            <>
              <RefreshCcw className="h-3.5 w-3.5 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCcw className="h-3.5 w-3.5 mr-2" />
              Fetch Data
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
