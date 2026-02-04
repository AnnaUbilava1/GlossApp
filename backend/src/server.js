import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/auth.js';
import companyRoutes from './routes/companies.js';
import discountOptionsRoutes from './routes/discountOptions.js';
import pricingRoutes from './routes/pricing.js';
import recordRoutes from './routes/records.js';
import userRoutes from './routes/users.js';
import vehicleRoutes from './routes/vehicles.js';
import washerRoutes from './routes/washers.js';
import typeConfigRoutes from './routes/typeConfig.js';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const swaggerOptions = {
  definition: {
    openapi: '3.0.0', 
    info: {
      title: 'GlossApp API Documentation',
      version: '1.0.0',
      description: 'A comprehensive guide to all API endpoints',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`, 
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // Look for API endpoints in all files ending in .js in the src directory
  apis: ['./src/**/*.js'], // Include all route files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check endpoint
 *     description: Returns the server status
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: GlossApp Backend API is running
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'GlossApp Backend API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/washers', washerRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/discount-options', discountOptionsRoutes);
app.use('/api/types', typeConfigRoutes);

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
  console.log(`🚀 Server is running on http://localhost:${PORT}/api-docs`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});
