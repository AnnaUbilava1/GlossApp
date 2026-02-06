# GlossApp - Car Wash Management System

A comprehensive car wash management system built with React Native (Expo) and Node.js, designed for managing wash records, pricing, vehicles, companies, and staff operations.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [User Roles & Permissions](#user-roles--permissions)
- [Development](#development)
- [Deployment](#deployment)
- [Security Notes](#security-notes)
- [Troubleshooting](#troubleshooting)

## Overview

GlossApp is a full-stack car wash management system that enables car wash businesses to:
- Track wash records and transactions
- Manage pricing matrices for different car types and wash services
- Handle company accounts with discount options
- Manage vehicle databases with license plate tracking
- Track washer/staff performance and commissions
- Generate reports and summaries
- Support bilingual interface (Georgian and English)

The application consists of:
- **Frontend**: React Native mobile app built with Expo (supports iOS, Android, and Web)
- **Backend**: Node.js REST API with Express.js and PostgreSQL database

## Features

### Core Functionality
- ✅ **Wash Record Management**: Create, view, edit, and delete wash records
- ✅ **Real-time Pricing**: Automatic price calculation based on car type, wash type, and discounts
- ✅ **Vehicle Database**: License plate autocomplete with vehicle history
- ✅ **Company Management**: Partner company accounts with customizable discount options
- ✅ **Washer Management**: Track staff members with salary percentage calculations
- ✅ **Dashboard**: Daily summaries with filtering and status indicators
- ✅ **Payment Tracking**: Cash and card payment methods with revenue summaries

### Admin Features
-  **User Management**: Create and manage staff accounts
-  **Pricing Configuration**: Manage pricing matrix for all car/wash type combinations
-  **Company & Discount Management**: Configure company accounts and discount options
-  **Vehicle Database Management**: Maintain vehicle records
-  **Washer Management**: Add, edit, and manage washer profiles
-  **Type Configuration**: Manage car types and wash types with bilingual labels
-  **Master PIN Protection**: Additional security layer for sensitive operations

### User Experience
-  **Bilingual Support**: Georgian and English language support
-  **Cross-platform**: iOS, Android, and Web support
-  **Modern UI**: Material Design 3 with React Native Paper
-  **Search & Filter**: Advanced filtering for records and vehicles
-  **Status Indicators**: Color-coded status system (Red/Orange/Green)

##  Tech Stack

### Frontend
- **Framework**: Expo ~54.0.29
- **Language**: TypeScript
- **Routing**: Expo Router (file-based routing)
- **UI Library**: React Native Paper ^5.14.5
- **State Management**: React Context API
- **HTTP Client**: Fetch API with custom wrapper
- **Storage**: AsyncStorage for preferences

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js ^4.22.1
- **Database**: PostgreSQL
- **ORM**: Prisma ^5.22.0
- **Authentication**: JWT (jsonwebtoken ^9.0.2)
- **Password Hashing**: bcryptjs ^2.4.3
- **Validation**: express-validator ^7.2.0
- **API Documentation**: Swagger/OpenAPI (swagger-jsdoc, swagger-ui-express)

##  Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)
- **Expo CLI** (optional, for development) - `npm install -g expo-cli`
- **Git** - [Download](https://git-scm.com/)

For mobile development:
- **iOS**: Xcode (macOS only)
- **Android**: Android Studio with Android SDK

##  Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd GlossApp
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
# Create a .env file in the backend directory with the following:
```

Create `backend/.env`:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/glossapp?schema=public"
DIRECT_URL="postgresql://username:password@localhost:5432/glossapp"

# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Master PIN for sensitive operations
MASTER_PIN=1234
```

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Seed the database with initial data
npm run prisma:seed
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Set up environment variables
# Create a .env file in the frontend directory:
```

Create `frontend/.env`:
```env
# API URL - Use your local IP address for mobile devices
# For localhost: http://localhost:3000
# For mobile devices on same network: http://YOUR_LOCAL_IP:3000
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**Important**: For mobile devices, replace `localhost` with your computer's local IP address (e.g., `http://192.168.1.100:3000`). You can find your IP using:
- **Windows**: `ipconfig` (look for IPv4 Address)
- **macOS/Linux**: `ifconfig` or `ip addr`

##  Configuration

### Database Configuration

1. **Create PostgreSQL Database**:
   ```sql
   CREATE DATABASE glossapp;
   ```

2. **Update DATABASE_URL** in `backend/.env` with your PostgreSQL credentials.

3. **Run Migrations**:
   ```bash
   cd backend
   npm run prisma:migrate
   ```

### API Configuration

The backend server runs on port 3000 by default. Ensure:
- The port is not already in use
- Firewall allows connections on port 3000
- For mobile devices, use your computer's local IP address instead of `localhost`

### Master PIN

The Master PIN is used for sensitive operations (editing/deleting records, managing configuration). Currently:
- **Backend**: Set via `MASTER_PIN` environment variable
- **Frontend**: Hardcoded in `src/utils/constants.ts` (should be moved to environment variable for production)

## Running the Application

### Start Backend Server

```bash
cd backend

# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The backend API will be available at:
- Local: `http://localhost:3000`
- Network: `http://YOUR_IP:3000`
- API Docs: `http://localhost:3000/api-docs` (Swagger UI)

### Start Frontend App

```bash
cd frontend

# Start Expo development server
npm start

# Or use specific platform commands:
npm run android    # Android emulator/device
npm run ios        # iOS simulator/device
npm run web        # Web browser
```

The Expo development server will start and display a QR code. You can:
- Scan the QR code with Expo Go app (iOS/Android)
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Press `w` for web browser

## Project Structure

```
GlossApp/
├── backend/                    # Backend API server
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   ├── migrations/        # Database migrations
│   │   ├── seed.js            # Database seeding script
│   │   └── seed-prices.js     # Price seeding script
│   ├── src/
│   │   ├── server.js          # Express server setup
│   │   ├── routes/            # API route handlers
│   │   │   ├── auth.js        # Authentication routes
│   │   │   ├── records.js     # Wash record routes
│   │   │   ├── vehicles.js    # Vehicle routes
│   │   │   ├── companies.js   # Company routes
│   │   │   ├── washers.js     # Washer routes
│   │   │   ├── pricing.js     # Pricing routes
│   │   │   ├── users.js       # User management routes
│   │   │   └── typeConfig.js  # Type configuration routes
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT authentication middleware
│   │   └── utils/
│   │       └── legacyMappings.js
│   ├── scripts/
│   │   └── hash-password.js   # Password hashing utility
│   ├── package.json
│   └── .env                   # Environment variables
│
├── frontend/                  # React Native mobile app
│   ├── app/                   # Expo Router routes
│   │   ├── (auth)/            # Authentication screens
│   │   ├── (app)/             # Main app screens
│   │   │   ├── dashboard.tsx  # Dashboard with records
│   │   │   ├── new-record.tsx # Create new wash record
│   │   │   └── edit-record/   # Edit wash record
│   │   └── (admin)/           # Admin panel screens
│   │       ├── pricing.tsx
│   │       ├── companies.tsx
│   │       ├── discounts.tsx
│   │       ├── vehicles.tsx
│   │       ├── washers.tsx
│   │       ├── types.tsx
│   │       └── appusers.tsx
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # React Context providers
│   │   │   ├── AuthContext.tsx
│   │   │   └── LanguageContext.tsx
│   │   ├── services/          # API service functions
│   │   ├── utils/             # Utilities and constants
│   │   ├── hooks/             # Custom React hooks
│   │   └── i18n/              # Internationalization
│   │       └── translations.ts
│   ├── assets/                # Images and static assets
│   ├── package.json
│   ├── app.json               # Expo configuration
│   └── .env                   # Environment variables
│
└── README.md                  # This file
```

## API Documentation

The API documentation is available via Swagger UI when the backend server is running:

**URL**: `http://localhost:3000/api-docs`

### Main API Endpoints

#### Authentication
- `POST /api/auth/login` - User login

#### Records
- `GET /api/records` - List wash records (with date filtering)
- `POST /api/records` - Create new wash record
- `PUT /api/records/:id` - Update wash record (requires master PIN)
- `DELETE /api/records/:id` - Delete wash record (requires master PIN)

#### Vehicles
- `GET /api/vehicles` - List/search vehicles
- `POST /api/vehicles` - Create vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle (requires master PIN)

#### Companies
- `GET /api/companies` - List companies
- `POST /api/companies` - Create company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company (requires master PIN)

#### Discounts
- `GET /api/discount-options` - List discounts
- `POST /api/discount-options` - Create discount
- `PUT /api/discount-options/:id` - Update discount
- `DELETE /api/discount-options/:id` - Delete discount (requires master PIN)

#### Washers
- `GET /api/washers` - List washers
- `POST /api/washers` - Create washer
- `PUT /api/washers/:id` - Update washer
- `DELETE /api/washers/:id` - Delete washer (requires master PIN)

#### Pricing
- `GET /api/pricing` - Get pricing matrix
- `POST /api/pricing` - Create/update pricing entry

#### Type Configuration
- `GET /api/types/car-types` - List car types
- `POST /api/types/car-types` - Create car type (requires master PIN)
- `PUT /api/types/car-types/:id` - Update car type (requires master PIN)
- `DELETE /api/types/car-types/:id` - Delete car type (requires master PIN)
- Similar endpoints for wash types (`/api/types/wash-types`)

#### Users
- `GET /api/users` - List users (admin only)
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `POST /api/users/:id/reset-password` - Reset password (admin only)

## User Roles & Permissions

### Admin (Manager)
- ✅ Full access to all features
- ✅ User management (create, reset passwords)
- ✅ Edit/delete wash records (with Master PIN)
- ✅ Manage pricing, companies, discounts, vehicles, washers
- ✅ Configure car types and wash types
- ✅ Mark records as paid

### Regular Staff
- ✅ Login to application
- ✅ Create new wash records
- ✅ View dashboard (read-only)
- ✅ Finish wash records (mark as completed)
- ❌ Cannot access Admin Panel
- ❌ Cannot edit or delete records
- ❌ Cannot mark records as paid
- ❌ Cannot manage configuration

## Development

### Backend Development

```bash
cd backend

# Run in development mode with auto-reload
npm run dev

# Generate Prisma Client after schema changes
npm run prisma:generate

# Create a new migration
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

### Frontend Development

```bash
cd frontend

# Start Expo development server
npm start

# Run linting
npm run lint

# Type checking (if using TypeScript)
npx tsc --noEmit
```

### Database Migrations

When modifying the Prisma schema (`backend/prisma/schema.prisma`):

```bash
cd backend

# Create and apply migration
npm run prisma:migrate

# Generate Prisma Client
npm run prisma:generate
```

### Creating a New User

To create a new user account, use the password hashing script:

```bash
cd backend
node scripts/hash-password.js
```

Then use the hashed password to create a user via the API or Prisma Studio.

# Deployment

### Backend Deployment

1. **Set up PostgreSQL database** on your hosting provider
2. **Configure environment variables**:
   - `DATABASE_URL` - Production database connection string
   - `JWT_SECRET` - Strong random secret key
   - `MASTER_PIN` - Secure master PIN
   - `NODE_ENV=production`
   - `PORT` - Server port (default: 3000)

3. **Run migrations**:
   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

### Frontend Deployment

#### Building for Production

1. **Configure API URL** in `frontend/.env`:
   ```env
   EXPO_PUBLIC_API_URL=https://your-api-domain.com
   ```

2. **Build with EAS**:
   ```bash
   cd frontend
   npx eas build --platform android  # For Android
   npx eas build --platform ios      # For iOS
   ```

3. **Submit to App Stores**:
   ```bash
   npx eas submit --platform android
   npx eas submit --platform ios
   ```

#### Development Build

For testing on physical devices:
```bash
cd frontend
npx expo prebuild
npx eas build --profile development --platform android
```

## Security Notes

### Important Security Considerations

1. **Master PIN**: Currently hardcoded in frontend constants. **Must be moved to secure environment variable** before production deployment.

2. **JWT Secret**: Use a strong, random string for `JWT_SECRET` in production.

3. **Database Credentials**: Never commit `.env` files to version control.

4. **API Security**: 
   - Enable HTTPS in production
   - Configure CORS properly for production domains
   - Implement rate limiting
   - Add request validation

5. **Password Security**: 
   - Use strong password policies
   - Passwords are hashed with bcryptjs
   - Consider implementing password reset flow

## Troubleshooting

### Backend Issues

**Database Connection Error**
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env` file
- Ensure database exists: `CREATE DATABASE glossapp;`

**Port Already in Use**
- Change `PORT` in `.env` file
- Or stop the process using port 3000

**Prisma Client Not Generated**
```bash
cd backend
npm run prisma:generate
```

### Frontend Issues

**Cannot Connect to API**
- Verify backend server is running
- Check `EXPO_PUBLIC_API_URL` in `.env`
- For mobile devices, use local IP instead of `localhost`
- Ensure firewall allows connections on port 3000

**Expo Go Connection Issues**
- Ensure mobile device and computer are on the same network
- Try restarting Expo development server
- Clear Expo cache: `npx expo start -c`

**Build Errors**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Expo cache: `npx expo start -c`
- Check Node.js version (requires v18+)

### Common Solutions

**Reset Database**
```bash
cd backend
npx prisma migrate reset
npm run prisma:seed
```

**Clear All Caches**
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npx expo start -c
npm install
```

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Paper Documentation](https://callstack.github.io/react-native-paper/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)



## Authors
 
Anna Ubilava;
Mari Kapanadze

---

**Version**: 1.0.0  
**Last Updated**: 2025-02-04

For detailed specifications, see `todo/specs.md`.

