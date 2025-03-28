
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, ChevronRight, Server, ShieldCheck, History } from 'lucide-react';
import amazonService from '@/services/amazon-service';
import dbService from '@/services/db-service';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const [isCheckingCredentials, setIsCheckingCredentials] = useState(true);
  
  useEffect(() => {
    // Check if credentials are already set
    const checkCredentials = async () => {
      setIsCheckingCredentials(true);
      try {
        const hasCredentials = amazonService.hasCredentials();
        
        if (hasCredentials) {
          // Record login timestamp and create a historical snapshot
          await handleLogin();
          
          // Automatically redirect to dashboard if credentials are set
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        }
      } catch (error) {
        console.error('Error during login process:', error);
        toast.error('There was a problem logging in');
      } finally {
        setIsCheckingCredentials(false);
      }
    };
    
    checkCredentials();
  }, [navigate]);
  
  const handleLogin = async () => {
    try {
      // Update the last login timestamp
      await dbService.updateLastLogin();
      
      // Fetch all endpoints to ensure we have the latest data
      toast.info('Refreshing data from all endpoints...');
      await amazonService.fetchAllEndpoints();
      
      // Create a historical snapshot
      await dbService.createHistoricalSnapshot();
      toast.success('Historical data snapshot created successfully');
    } catch (error) {
      console.error('Error creating historical snapshot:', error);
      toast.error('Failed to create historical data snapshot');
      throw error;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-4xl text-center mb-12 animate-fade-in">
        <div className="flex justify-center mb-6">
          <Database className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Amazon SP-API Data Extractor</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Extract and organize data from Amazon's Selling Partner API with a beautiful interface
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-12">
        <Card className="glass glass-hover border-opacity-30 animate-slide-up stagger-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-center mb-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </CardTitle>
            <CardTitle className="text-xl">Secure & Local</CardTitle>
            <CardDescription>
              Your data never leaves your computer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              All your Amazon credentials and data are stored locally in your browser's IndexedDB database,
              ensuring complete privacy and security.
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass glass-hover border-opacity-30 animate-slide-up stagger-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-center mb-4">
              <Server className="h-8 w-8 text-primary" />
            </CardTitle>
            <CardTitle className="text-xl">Local Proxy</CardTitle>
            <CardDescription>
              Bypass CORS restrictions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              A simple local proxy server lets you access Amazon's SP-API directly 
              from your Windows 11 PC without CORS issues or third-party services.
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass glass-hover border-opacity-30 animate-slide-up stagger-3">
          <CardHeader>
            <CardTitle className="flex items-center justify-center mb-4">
              <History className="h-8 w-8 text-primary" />
            </CardTitle>
            <CardTitle className="text-xl">Historical Data</CardTitle>
            <CardDescription>
              Track changes over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Automatically creates snapshots of your Amazon data every time you log in,
              giving you a historical record to track changes over time.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 animate-fade-in">
        <Button
          size="lg"
          onClick={() => navigate('/setup')}
          className="text-base flex items-center"
          disabled={isCheckingCredentials}
        >
          Get Started
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/dashboard')}
          className="text-base"
          disabled={isCheckingCredentials}
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Index;
