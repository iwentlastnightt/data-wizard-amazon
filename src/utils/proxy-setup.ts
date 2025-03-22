
export const proxySetupInstructions = `
# Amazon SP-API Local Proxy Setup Instructions

This guide will help you set up a local proxy server to bypass CORS restrictions when accessing the Amazon SP-API.

## Prerequisites

- Node.js (v14 or later)
- npm or yarn

## Step 1: Create a new directory for your proxy server

Create a new folder somewhere on your computer, for example:
\`\`\`
mkdir amazon-sp-api-proxy
cd amazon-sp-api-proxy
\`\`\`

## Step 2: Initialize a new Node.js project

Run the following command to create a new Node.js project:
\`\`\`
npm init -y
\`\`\`

## Step 3: Install the required dependencies

\`\`\`
npm install express cors axios dotenv
\`\`\`

## Step 4: Create a .env file

Create a file named \`.env\` in the root directory and add:
\`\`\`
PORT=8080
\`\`\`

## Step 5: Create the proxy server file

Create a file named \`server.js\` with the following content:

\`\`\`javascript
// ES Module syntax (for Node.js with "type": "module" in package.json)
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Amazon SP-API proxy endpoint
app.post('/api/amazon/token', async (req, res) => {
  try {
    const { clientId, clientSecret, refreshToken } = req.body;
    
    if (!clientId || !clientSecret || !refreshToken) {
      return res.status(400).json({ 
        error: 'Missing required parameters: clientId, clientSecret, refreshToken' 
      });
    }

    // In a production environment, you would make an actual call to Amazon's token endpoint
    // For local testing, we'll just simulate a successful response
    res.status(200).json({
      access_token: 'simulated-access-token-' + Date.now(),
      token_type: 'bearer',
      expires_in: 3600
    });
  } catch (error) {
    console.error('Error obtaining token:', error);
    res.status(500).json({ 
      error: 'Failed to obtain access token',
      details: error.message
    });
  }
});

// Proxy API requests to Amazon SP-API
app.post('/api/amazon/request', async (req, res) => {
  try {
    const { endpoint, method = 'GET', params, headers, body } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ error: 'Missing required parameter: endpoint' });
    }

    // In a production environment, you would make an actual call to Amazon's SP-API
    // For local testing, we'll just simulate a successful response with mock data
    const mockResponse = {
      success: true,
      endpoint,
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a simulated response from the proxy server',
        endpoint,
        params
      }
    };

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    res.status(200).json(mockResponse);
  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(500).json({ 
      error: 'Failed to proxy request to Amazon SP-API',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(\`Amazon SP-API proxy server running on port \${PORT}\`);
  console.log(\`Health check: http://localhost:\${PORT}/health\`);
});
\`\`\`

## Alternative: Using CommonJS syntax

If you're having issues with ES Modules, you can use CommonJS syntax instead. To do this, either:

1. Delete the "type": "module" line from your package.json, or
2. Rename your server.js file to server.cjs, or
3. Create a new server.cjs file with the following CommonJS code:

\`\`\`javascript
// CommonJS syntax
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Amazon SP-API proxy endpoint
app.post('/api/amazon/token', async (req, res) => {
  try {
    const { clientId, clientSecret, refreshToken } = req.body;
    
    if (!clientId || !clientSecret || !refreshToken) {
      return res.status(400).json({ 
        error: 'Missing required parameters: clientId, clientSecret, refreshToken' 
      });
    }

    // In a production environment, you would make an actual call to Amazon's token endpoint
    // For local testing, we'll just simulate a successful response
    res.status(200).json({
      access_token: 'simulated-access-token-' + Date.now(),
      token_type: 'bearer',
      expires_in: 3600
    });
  } catch (error) {
    console.error('Error obtaining token:', error);
    res.status(500).json({ 
      error: 'Failed to obtain access token',
      details: error.message
    });
  }
});

// Proxy API requests to Amazon SP-API
app.post('/api/amazon/request', async (req, res) => {
  try {
    const { endpoint, method = 'GET', params, headers, body } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ error: 'Missing required parameter: endpoint' });
    }

    // In a production environment, you would make an actual call to Amazon's SP-API
    // For local testing, we'll just simulate a successful response with mock data
    const mockResponse = {
      success: true,
      endpoint,
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a simulated response from the proxy server',
        endpoint,
        params
      }
    };

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    res.status(200).json(mockResponse);
  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(500).json({ 
      error: 'Failed to proxy request to Amazon SP-API',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(\`Amazon SP-API proxy server running on port \${PORT}\`);
  console.log(\`Health check: http://localhost:\${PORT}/health\`);
});
\`\`\`

## Step 6: Start the proxy server

If using ES Module syntax (server.js with "type": "module"):
\`\`\`
node server.js
\`\`\`

If using CommonJS syntax (server.cjs or after removing "type": "module"):
\`\`\`
node server.cjs
\`\`\`

You should see a message indicating that the server is running.

## Step 7: Testing the proxy server

1. Make sure the proxy server is running.
2. In the Amazon SP-API Data Extractor application, enter your credentials.
3. The application will automatically use the proxy server to bypass CORS restrictions.

## Troubleshooting

- If you encounter errors about 'require' not being defined, your Node.js is treating the file as an ES module. Use the ES Module code or one of the CommonJS alternatives mentioned above.
- If you encounter errors about 'import' not being recognized, your Node.js is treating the file as CommonJS. Use the CommonJS code or add "type": "module" to your package.json.
- Make sure the proxy server is running on the expected port (default: 8080).
- Ensure no other application is using the same port.

## Notes for Production Use

For production use, you would need to:
1. Implement proper error handling.
2. Add authentication to the proxy server.
3. Deploy to a secure server environment.
4. Use HTTPS instead of HTTP.
5. Implement proper caching and rate limiting.
`;
