
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Database, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="text-center max-w-md animate-fade-in">
        <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">404</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">This page doesn't exist</p>
        
        <div className="space-y-4">
          <Button 
            onClick={() => navigate('/')}
            className="mr-4"
          >
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            <Database className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
