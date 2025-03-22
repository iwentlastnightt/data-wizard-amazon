
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiResponse } from '@/types/amazon-api';

interface DataPreviewProps {
  response: ApiResponse;
}

export function DataPreview({ response }: DataPreviewProps) {
  const [activeTab, setActiveTab] = useState('preview');
  
  const renderPreview = () => {
    if (!response.data) {
      return (
        <div className="py-4 text-center text-gray-500">
          No data available for preview
        </div>
      );
    }
    
    // Handle different types of data based on the endpoint
    switch (response.endpointId) {
      case 'listings-items':
        if (response.data.items && response.data.items.length > 0) {
          return (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ASIN</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {response.data.items.slice(0, 5).map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{item.sku}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{item.asin}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{item.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${item.price}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {response.data.items.length > 5 && (
                <div className="text-center py-2 text-sm text-gray-500">
                  Showing 5 of {response.data.items.length} items
                </div>
              )}
            </div>
          );
        }
        break;
        
      case 'orders':
        if (response.data.orders && response.data.orders.length > 0) {
          return (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {response.data.orders.slice(0, 5).map((order: any, index: number) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{order.orderId}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{new Date(order.purchaseDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{order.orderStatus}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {order.orderTotal?.currencyCode} {order.orderTotal?.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {response.data.orders.length > 5 && (
                <div className="text-center py-2 text-sm text-gray-500">
                  Showing 5 of {response.data.orders.length} orders
                </div>
              )}
            </div>
          );
        }
        break;
        
      // Add cases for other endpoint types as needed
      
      default:
        return (
          <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-auto max-h-64 text-sm">
            {JSON.stringify(response.data, null, 2)}
          </pre>
        );
    }
    
    // Default case if no specific renderer was applied
    return (
      <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-auto max-h-64 text-sm">
        {JSON.stringify(response.data, null, 2)}
      </pre>
    );
  };
  
  return (
    <Card className="glass glass-hover overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Data Preview</CardTitle>
        <CardDescription>
          Viewing data from the {response.endpointId.replace(/-/g, ' ')} endpoint
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="preview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="raw">Raw JSON</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="border rounded-md p-0 overflow-hidden">
            {renderPreview()}
          </TabsContent>
          
          <TabsContent value="raw" className="border rounded-md p-0 overflow-hidden">
            <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-auto max-h-80 text-sm">
              {JSON.stringify(response.data, null, 2)}
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
