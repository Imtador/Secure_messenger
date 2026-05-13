import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import http from 'http';
import config from './config/index.js';
import logger from './utils/logger.js';
import pool, { query } from './config/database.js';
import { connectRedis } from './config/redis.js';
import createTables from './models/schema.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'securechat-api',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  if (config.env === 'development') {
    res.status(500).json({
      success: false,
      message: err.message,
      stack: err.stack,
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });

  // Handle authentication for WebSocket
  socket.on('authenticate', async (data) => {
    try {
      const { token } = data;
      // TODO: Verify token and associate socket with user
      socket.join(`user:${userId}`);
      socket.emit('authenticated', { success: true });
    } catch (error) {
      socket.emit('authentication_error', { message: 'Authentication failed' });
    }
  });
});

// Initialize database and start server
const initializeServer = async () => {
  try {
    // Create logs directory
    const fs = await import('fs');
    const path = await import('path');
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Initialize database tables
    await createTables();
    
    // Connect to Redis
    await connectRedis();
    
    // Start server
    server.listen(config.port, () => {
      logger.info(`SecureChat API server running on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
    });
  } catch (error) {
    logger.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  
  try {
    await server.close();
    await pool.end();
    logger.info('Server closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  
  try {
    await server.close();
    await pool.end();
    logger.info('Server closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

initializeServer();

export default app;
