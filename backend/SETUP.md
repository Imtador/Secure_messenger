# SecureChat Messenger - Phase 1 Setup Guide

## Overview
This document provides instructions for setting up and running Phase 1 of the SecureChat Messenger project, which includes:
- Server core with HTTP server
- PostgreSQL database with schema
- Redis cache
- User authentication with ECDH key support
- JWT-based authentication

## Prerequisites

### Required Software
- **Node.js** >= 18.0.0
- **PostgreSQL** >= 14
- **Redis** >= 6.0

### Optional (for development)
- **Docker** and **Docker Compose** (for containerized setup)

## Quick Start with Docker (Recommended)

### 1. Start Database Services

```bash
docker-compose up -d postgres redis
```

### 2. Install Dependencies

```bash
npm install
cd backend && npm install
```

### 3. Configure Environment

Copy the example environment file and update values:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set:
- Database credentials (match Docker compose values)
- JWT secret (use a strong random string)
- Redis connection settings

### 4. Initialize Database

The database schema will be created automatically on first server start.

### 5. Start the Backend Server

```bash
cd backend
npm run dev
```

The server will start on `http://localhost:3000`

### 6. Verify Installation

Test the health endpoint:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "securechat-api"
}
```

## Manual Setup (Without Docker)

### 1. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS (Homebrew):**
```bash
brew install postgresql
```

### 2. Install Redis

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
```

**macOS (Homebrew):**
```bash
brew install redis
```

### 3. Create Database and User

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE securechat;
CREATE USER securechat_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE securechat TO securechat_user;
\q
```

### 4. Configure Environment

```bash
cp backend/.env.example backend/.env
```

Update the following in `backend/.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=securechat
DB_USER=securechat_user
DB_PASSWORD=your_secure_password

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your_very_secure_random_secret_key_here
```

### 5. Install Dependencies

```bash
cd backend
npm install
```

### 6. Start the Server

```bash
npm run dev
```

## API Endpoints (Phase 1)

### Authentication

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "publicKey": "base64_encoded_ecdh_public_key",
  "encryptedPrivateKey": "base64_encoded_encrypted_private_key",
  "privateKeyIv": "iv_for_encryption",
  "privateKeyTag": "auth_tag_for_encryption"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "usernameOrEmail": "johndoe",
  "password": "SecurePass123"
}
```

#### Refresh Token
```
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

### Users

#### Get Current User Profile
```
GET /api/users/me
Authorization: Bearer <access_token>
```

#### Update Profile
```
PUT /api/users/me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "displayName": "John Doe",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

#### Search Users
```
GET /api/users/search?q=john
Authorization: Bearer <access_token>
```

#### Get User by ID
```
GET /api/users/:id
Authorization: Bearer <access_token>
```

## Database Schema

Phase 1 creates the following tables:

- **users** - User accounts with ECDH keys
- **contacts** - Contact relationships
- **chats** - Chat rooms (direct and group)
- **chat_members** - Chat membership
- **messages** - Encrypted messages
- **attachments** - File attachments metadata
- **chat_keys** - Encrypted chat encryption keys

## Security Features

- **Password Hashing**: Argon2id with configurable parameters
- **Authentication**: JWT with short-lived access tokens + refresh tokens
- **Input Validation**: express-validator on all endpoints
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for frontend domain only
- **Helmet**: Security headers

## Testing

Run tests:

```bash
cd backend
npm test
```

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running: `sudo service postgresql status`
- Check credentials in `.env` file
- Verify database exists: `psql -U securechat_user -d securechat`

### Redis Connection Error
- Ensure Redis is running: `sudo service redis-server status`
- Check Redis port in `.env` file

### Port Already in Use
- Change PORT in `.env` file
- Or kill the process: `lsof -ti:3000 | xargs kill`

## Next Steps (Phase 2)

After completing Phase 1 setup, implement:
- Contact management (add, accept, remove contacts)
- 1-to-1 chat creation
- ECDH shared key derivation
- Chat listing with last message preview

## Project Structure

```
/workspace
├── backend/
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── models/        # Database models and schema
│   │   ├── routes/        # API route handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Utility functions
│   │   └── index.js       # Application entry point
│   ├── tests/             # Test files
│   ├── .env.example       # Environment template
│   └── package.json
├── frontend/              # Frontend application (Phase 6)
├── docker-compose.yml     # Docker services
└── README.md
```

## Support

For issues or questions, please refer to the main README.md or check the logs in `backend/logs/`.
