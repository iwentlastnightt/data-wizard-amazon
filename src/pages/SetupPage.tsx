
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { proxySetupInstructions } from '@/utils/proxy-setup';
import { CheckCircle2, ChevronLeft, ClipboardCopy, FileCog, Server, Terminal } from 'lucide-react';

export default function SetupPage() {
  const navigate = useNavigate();
  const [copySuccess, setCopySuccess] = useState(false);
  
  const handleCopyInstructions = async () => {
    try {
      await navigator.clipboard.writeText(proxySetupInstructions);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="container mx-auto max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <Card className="glass glass-hover border-opacity-40 animate-fade-in">
          <CardHeader>
            <div className="flex items-center justify-center mb-6">
              <Server className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-semibold text-center">Local Proxy Setup</CardTitle>
            <CardDescription className="text-center max-w-xl mx-auto">
              To bypass CORS restrictions and securely access Amazon SP-API, 
              you'll need to run a local proxy server on your Windows 11 PC.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="instructions">
              <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
                <TabsTrigger value="instructions" className="flex items-center">
                  <FileCog className="h-4 w-4 mr-2" />
                  Setup Instructions
                </TabsTrigger>
                <TabsTrigger value="test" className="flex items-center">
                  <Terminal className="h-4 w-4 mr-2" />
                  Test Connection
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="instructions">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 mb-4 border border-gray-200 dark:border-gray-800">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Proxy Server Setup Instructions</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleCopyInstructions}
                      className="flex items-center"
                    >
                      {copySuccess ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <ClipboardCopy className="h-4 w-4 mr-2" />
                          Copy All
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="prose dark:prose-invert prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-mono text-xs overflow-auto max-h-96 p-4 bg-gray-100 dark:bg-gray-800 rounded">
                      {proxySetupInstructions}
                    </pre>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Why a Local Proxy?</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Amazon SP-API has CORS restrictions that prevent direct API calls from a web browser.
                    A local proxy server running on your PC acts as an intermediary, allowing the application
                    to securely communicate with Amazon's servers without CORS issues.
                  </p>
                  
                  <h3 className="text-lg font-semibold">Security Benefits</h3>
                  <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Your Amazon credentials never leave your computer</li>
                    <li>All API communication happens locally</li>
                    <li>No need for third-party servers or cloud services</li>
                    <li>Complete control over your data</li>
                  </ul>
                </div>
              </TabsContent>
              
              <TabsContent value="test">
                <Card>
                  <CardHeader>
                    <CardTitle>Test Your Proxy Server</CardTitle>
                    <CardDescription>
                      Verify that your local proxy server is running correctly
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">1. Ensure your proxy server is running</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Make sure you've started the proxy server using <code>node server.js</code>
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">2. Test the health check endpoint</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Open <a href="http://localhost:8080/health" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">http://localhost:8080/health</a> in your browser.
                        You should see a JSON response with <code>{`{"status":"ok"}`}</code>
                      </p>
                    </div>
                    
                    <div className="rounded-md border p-4 bg-gray-50 dark:bg-gray-900">
                      <h4 className="font-medium mb-2">Manual Health Check</h4>
                      <Button
                        variant="outline"
                        onClick={() => {
                          window.open('http://localhost:8080/health', '_blank');
                        }}
                      >
                        Check Proxy Status
                      </Button>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-gray-50/50 dark:bg-gray-800/20 flex justify-center py-4">
                    <p className="text-sm text-gray-500">
                      After confirming your proxy is running, continue to the credentials page
                    </p>
                  </CardFooter>
                </Card>
                
                <div className="flex justify-center mt-6">
                  <Button onClick={() => navigate('/credentials')}>
                    Continue to Credentials
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="border-t bg-gray-50/50 dark:bg-gray-800/20 flex justify-center py-4">
            <p className="text-sm text-gray-500">
              Once your proxy server is running, you can proceed to setting up your Amazon SP-API credentials
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
