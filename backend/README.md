# GlossApp Backend API

Node.js backend API for GlossApp car wash management system using Express, Prisma ORM, and PostgreSQL.

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Database Setup

1. **Install PostgreSQL** (if not already installed)
   - Download from: https://www.postgresql.org/download/
   - Or use Docker: `docker run --name postgres-glossapp -e POSTGRES_PASSWORD=yourpassword -p 5432:5432 -d postgres`

2. **Create Database**
   ```sql
   CREATE DATABASE glossapp;
   ```

3. **Configure Environment Variables**
   - Copy `.env.example` to `.env`
   - Update `DATABASE_URL` with your PostgreSQL credentials:
     ```
     DATABASE_URL="postgresql://username:password@localhost:5432/glossapp?schema=public"
     ```

### 3. Initialize Prisma

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view/edit data
npm run prisma:studio
```

### 4. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000` (or the PORT specified in `.env`).

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma      # Database schema definition
│   └── migrations/        # Database migration files (auto-generated)
├── src/
│   ├── server.js          # Main server file
│   ├── routes/            # API route handlers
│   ├── controllers/       # Business logic controllers
│   ├── middleware/        # Custom middleware (auth, validation, etc.)
│   └── utils/             # Utility functions
├── .env                   # Environment variables (create from .env.example)
├── .env.example           # Example environment variables
└── package.json
```

## Next Steps

1. **Create API Routes**: Set up routes for authentication, records, vehicles, companies, etc.
2. **Implement Authentication**: Add JWT-based authentication middleware
3. **Add Validation**: Use express-validator for request validation
4. **Error Handling**: Enhance error handling and responses
5. **Testing**: Add unit and integration tests

## API Endpoints (To be implemented)

- `POST /api/auth/login` - User authentication
- `GET /api/records` - Get all wash records
- `POST /api/records` - Create new wash record
- `PUT /api/records/:id` - Update wash record
- `DELETE /api/records/:id` - Delete wash record
- `GET /api/vehicles` - Get all vehicles
- `POST /api/vehicles` - Create new vehicle
- `GET /api/companies` - Get all companies
- `POST /api/companies` - Create new company
- `GET /api/pricing` - Get pricing matrix
- `PUT /api/pricing` - Update pricing matrix

## Database Schema

The Prisma schema includes:
- **Users**: Authentication and authorization
- **Companies**: Company information with discount settings
- **Vehicles**: Vehicle database with license plates
- **WashRecords**: Car wash transaction records
- **Washers**: Washer/staff names
- **Pricing**: Pricing matrix for car types and service types

