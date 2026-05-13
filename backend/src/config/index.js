import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  
  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'securechat',
    user: process.env.DB_USER || 'securechat_user',
    password: process.env.DB_PASSWORD || '',
  },
  
  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // Argon2id
  argon2: {
    memoryCost: parseInt(process.env.ARGON2_MEMORY_COST, 10) || 65536,
    timeCost: parseInt(process.env.ARGON2_TIME_COST, 10) || 3,
    parallelism: parseInt(process.env.ARGON2_PARALLELISM, 10) || 4,
  },
  
  // MinIO/S3
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost:9000',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucket: process.env.MINIO_BUCKET || 'securechat-files',
  },
  
  // Frontend URL for CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

export default config;
