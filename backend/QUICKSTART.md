# Quick Start Guide

## Step 1: Install PostgreSQL

If you don't have PostgreSQL installed:

**Option A: Download and Install**
- Visit https://www.postgresql.org/download/
- Download and install PostgreSQL for your OS
- Remember the password you set for the `postgres` user

**Option B: Use Docker (Recommended)**
```bash
docker run --name postgres-glossapp -e POSTGRES_PASSWORD=yourpassword -p 5432:5432 -d postgres
```

## Step 2: Create Database

Connect to PostgreSQL and create the database:

```bash
# Using psql command line
psql -U postgres
CREATE DATABASE glossapp;
\q
```

Or use a GUI tool like pgAdmin or DBeaver.

## Step 3: Configure Environment

1. Create a `.env` file in the `backend` folder:
```bash
cd backend
cp .env.example .env
```

2. Edit `.env` and update the `DATABASE_URL`:
```
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/glossapp?schema=public"
```

Replace `yourpassword` with your actual PostgreSQL password.

Also set:
- `JWT_SECRET`: A random string for JWT token signing (use a strong random string in production)
- `MASTER_PIN`: The PIN required for admin operations (e.g., "1234")

## Step 4: Install Dependencies

```bash
cd backend
npm install
```

## Step 5: Set Up Database Schema

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations to create tables
npm run prisma:migrate

# (Optional) Seed initial data (admin user, default pricing, etc.)
npm run prisma:seed
```

## Step 6: Start the Server

```bash
# Development mode (auto-reload on changes)
npm run dev

# Or production mode
npm start
```

The server should now be running on `http://localhost:3000`

## Step 7: Test the API

You can test the health endpoint:
```bash
curl http://localhost:3000/health
```

Or use the default seeded users:
- **Admin**: `admin@glossapp.com` / `admin123`
- **Staff**: `staff@glossapp.com` / `staff123`

## Next Steps

1. Update your React Native app to call the backend API instead of Firebase
2. Add more API routes as needed (vehicles, companies, pricing, etc.)
3. Configure CORS if needed for your mobile app
4. Set up proper error handling and logging

## Troubleshooting

**Database connection error?**
- Check that PostgreSQL is running
- Verify the DATABASE_URL in `.env` is correct
- Make sure the database `glossapp` exists

**Port already in use?**
- Change the PORT in `.env` to a different number (e.g., 3001)

**Prisma errors?**
- Make sure you ran `npm run prisma:generate` after installing dependencies
- Check that your DATABASE_URL is correct

