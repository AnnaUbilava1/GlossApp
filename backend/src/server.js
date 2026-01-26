import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import recordRoutes from './routes/records.js';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'GlossApp Backend API is running' });
});

// API Documentation endpoint (simple HTML page)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>GlossApp API Documentation</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          max-width: 900px;
          margin: 50px auto;
          padding: 20px;
          background: #f5f5f5;
        }
        h1 { color: #2563eb; }
        .endpoint {
          background: white;
          padding: 15px;
          margin: 10px 0;
          border-radius: 8px;
          border-left: 4px solid #2563eb;
        }
        .method {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 12px;
          margin-right: 10px;
        }
        .get { background: #10b981; color: white; }
        .post { background: #3b82f6; color: white; }
        .put { background: #f59e0b; color: white; }
        .delete { background: #ef4444; color: white; }
        code {
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
        }
        .status { color: #10b981; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>🚀 GlossApp Backend API</h1>
      <p class="status">✅ Server is running on port ${PORT}</p>
      
      <h2>Available Endpoints</h2>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <code>/health</code>
        <p>Health check endpoint - returns server status</p>
      </div>
      
      <h3>Authentication</h3>
      <div class="endpoint">
        <span class="method post">POST</span>
        <code>/api/auth/login</code>
        <p>User login - requires: { "email": "string", "password": "string" }</p>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <code>/api/auth/me</code>
        <p>Get current user info - requires Authorization header with JWT token</p>
      </div>
      
      <h3>Wash Records</h3>
      <div class="endpoint">
        <span class="method get">GET</span>
        <code>/api/records</code>
        <p>Get all wash records - requires authentication</p>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <code>/api/records/:id</code>
        <p>Get single wash record - requires authentication</p>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <code>/api/records</code>
        <p>Create new wash record - requires authentication</p>
      </div>
      <div class="endpoint">
        <span class="method put">PUT</span>
        <code>/api/records/:id</code>
        <p>Update wash record - admin only, requires master PIN</p>
      </div>
      <div class="endpoint">
        <span class="method delete">DELETE</span>
        <code>/api/records/:id</code>
        <p>Delete wash record - admin only, requires master PIN</p>
      </div>
      
      <h3>Testing</h3>
      <p>Use tools like <strong>Postman</strong>, <strong>curl</strong>, or your React Native app to test these endpoints.</p>
      <p>For the health check, you can visit: <a href="/health">/health</a></p>
    </body>
    </html>
  `);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});
