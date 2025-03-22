
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { AmazonCredentials } from '@/types/amazon-api';
import amazonService from '@/services/amazon-service';
import { AlertCircle, Info, Lock, Shield, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const credentialsSchema = z.object({
  clientId: z.string().min(3, { message: 'Client ID is required' }),
  clientSecret: z.string().min(3, { message: 'Client Secret is required' }),
  refreshToken: z.string().min(3, { message: 'Refresh Token is required' }),
});

export default function CredentialsPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof credentialsSchema>>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      clientId: '',
      clientSecret: '',
      refreshToken: '',
    },
  });
  
  const onSubmit = async (data: z.infer<typeof credentialsSchema>) => {
    setIsSubmitting(true);
    
    try {
      const credentials: AmazonCredentials = {
        clientId: data.clientId.trim(),
        clientSecret: data.clientSecret.trim(),
        refreshToken: data.refreshToken.trim(),
      };
      
      // Validate credentials
      const isValid = await amazonService.setCredentials(credentials);
      
      if (isValid) {
        toast.success('Credentials saved successfully');
        navigate('/dashboard');
      } else {
        toast.error('Failed to validate credentials. Please check and try again.');
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast.error('Failed to save credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-lg animate-fade-in">
        <Card className="glass glass-hover border-opacity-40">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-6">
              <ShieldCheck className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-semibold text-center">Amazon SP-API Credentials</CardTitle>
            <CardDescription className="text-center">
              Enter your Amazon SP-API credentials to start extracting data
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Alert className="mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              <AlertTitle>Secure Storage</AlertTitle>
              <AlertDescription className="text-sm text-gray-600 dark:text-gray-300">
                Your credentials are stored locally in your browser's IndexedDB and are never transmitted to any server.
              </AlertDescription>
            </Alert>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="amzn1.application-oa2-client.example123"
                          autoComplete="off"
                          className="transition-all duration-200"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The Client ID from your Amazon SP-API application
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="clientSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Secret</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="password"
                            placeholder="Enter your client secret"
                            autoComplete="off"
                            className="transition-all duration-200"
                            {...field}
                          />
                          <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        The Client Secret from your Amazon SP-API application
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="refreshToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Refresh Token</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="password"
                            placeholder="Enter your refresh token"
                            autoComplete="off"
                            className="transition-all duration-200"
                            {...field}
                          />
                          <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        The Refresh Token from your Amazon SP-API application
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full transition-all duration-300"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Validating...' : 'Save Credentials'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
          
          <CardFooter className="flex justify-center border-t bg-gray-50/50 dark:bg-gray-800/20 py-4">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Shield className="h-4 w-4 mr-2" />
              <span>Your data is stored securely on your local device</span>
            </div>
          </CardFooter>
        </Card>
        
        <Alert className="mt-6 glass border-opacity-40">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Local Proxy Required</AlertTitle>
          <AlertDescription className="text-sm">
            To bypass CORS restrictions, you'll need to run a local proxy server. 
            <Button 
              variant="link" 
              className="h-auto p-0 text-sm font-medium underline"
              onClick={() => navigate('/setup')}
            >
              View setup instructions
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
