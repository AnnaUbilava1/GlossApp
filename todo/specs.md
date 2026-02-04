# GlossApp - Car Wash Management System Specifications

This specification outlines the complete technical and functional requirements for the **GlossApp** car wash management system. The application consists of a React Native mobile app (frontend) and a Node.js REST API (backend), designed for tablets and phones, requiring a stable internet connection.

---

## 1. General Overview

- **Platform:** Native Android/iOS Application (React Native)
- **Frontend Framework:** Expo (Managed Workflow with Expo Router)
- **Frontend Language:** TypeScript (.ts / .tsx)
- **Backend:** Node.js with Express.js REST API
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT (JSON Web Tokens)
- **Connectivity:** Online only (Internet connection required)
- **Printing:** Integration with Bluetooth Thermal Printers for receipts (Requires `npx expo prebuild` in final phase)
- **Security:** Role-based access control (Admin vs. Regular Staff) with Master PIN protection
- **Internationalization:** Georgian and English language support

---

## 2. System Architecture

### 2.1 Frontend Architecture

- **Framework:** Expo Router (File-based routing)
- **State Management:** React Context API
  - `AuthContext` - User authentication and session management
  - `LanguageContext` - Internationalization (i18n) support
- **UI Library:** React Native Paper (Material Design 3)
- **Theme:** Custom Blue/White branding
- **API Communication:** REST API client with JWT token injection
- **Storage:** AsyncStorage for language preferences

### 2.2 Backend Architecture

- **Runtime:** Node.js with Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma (type-safe database client)
- **Authentication:** JWT tokens with bcrypt password hashing
- **API Documentation:** Swagger/OpenAPI
- **Security:** CORS, input validation, role-based middleware

### 2.3 Database Schema

The system uses PostgreSQL with the following main entities:

- **Users** - Application users (admin/staff roles)
- **WashRecords** - Car wash transaction records
- **Vehicles** - License plate database
- **Companies** - Partner companies
- **Discounts** - Company-specific discount options
- **Washers** - Employee/worker management
- **CarType** - Car type configuration (with bilingual labels)
- **WashType** - Wash type configuration (with bilingual labels)
- **Pricing** - Price matrix (CarType × WashType)

---

## 3. User Roles & Permissions

### 3.1 Admin (Manager)

- **Access:** Full access to all pages and features
- **User Management:** 
  - Create accounts for Staff users
  - Reset passwords for existing users
  - View all users and their roles
- **Record Management:** 
  - View all wash records
  - Edit records (requires Master PIN)
  - Delete records (requires Master PIN)
  - Mark records as paid (Cash/Card)
- **Configuration:** 
  - Manage Pricing Matrix
  - Manage Companies and Discounts
  - Manage Vehicles database
  - Manage Washers
  - Manage Car Types and Wash Types
- **Security:** Master PIN required for all destructive operations

### 3.2 Regular Staff

- **Access:** Limited to core operations
- **Capabilities:**
  - Login to the application
  - Create new wash records
  - View dashboard (read-only)
  - Finish wash records (mark as completed)
- **Restrictions:**
  - Cannot access Admin Panel
  - Cannot edit or delete existing records
  - Cannot mark records as paid
  - Cannot manage configuration

---

## 4. Functional Requirements

### 4.1 Authentication

- **Login Screen:**
  - Email and Password input fields
  - Login button connects to backend API
  - Error handling for invalid credentials
  - Loading states during authentication
- **Security:**
  - Sign Up option removed (admin-only user creation)
  - Forgot Password option removed (admin handles password resets)
  - JWT token stored securely
  - Automatic logout on token expiration

### 4.2 New Record Creation (Staff View)

- **License Plate:**
  - Text input with autocomplete/search functionality
  - Queries vehicle database as user types (debounced)
  - Auto-fills Car Type and Company if vehicle exists
  - Auto-creates vehicle entry if new plate is entered
- **Car Type:**
  - Dropdown populated from database configuration
  - Supports bilingual labels (Georgian/English)
  - Can be managed by Admin
- **Wash Type:**
  - Dropdown populated from database configuration
  - Supports bilingual labels (Georgian/English)
  - Can be managed by Admin
- **Company & Discount:**
  - Combined dropdown showing:
    - "Physical Person" options (hardcoded discounts: 30%, 50%)
    - Company-specific options (based on company's allowed discounts)
  - Auto-selects company and lowest discount if vehicle is linked
- **Price (Read-Only):**
  - Automatically calculated: `Base_Price × (1 - Discount_Percent)`
  - Updates in real-time as selections change
  - Cannot be manually edited
- **Box Number:**
  - Dropdown selection (Box 1, Box 2, etc.)
  - No occupancy validation
- **Washer:**
  - Dropdown populated from Washers database
  - Shows washer username/name
  - Salary percentage tracked for commission calculation
- **Timestamps:**
  - Start Time: Automatically set to current timestamp on save
  - End Time: Set when record is marked as finished
- **Status:**
  - Default: Unfinished/Unpaid (Red status)
  - Hidden during creation

### 4.3 Dashboard & Record Management

- **Default View:**
  - Shows records for current day
  - Displays in reverse chronological order (newest first)
- **Date Filtering:**
  - Date range picker (Start Date to End Date)
  - Filters records by start time
  - Updates summary totals based on filtered records
- **Record Display:**
  - Color-coded status indicators:
    - 🔴 **Red (#FFCDD2):** Unfinished & Unpaid
    - 🟠 **Orange (#FFE0B2):** Finished but Unpaid
    - 🟢 **Green (#C8E6C9):** Finished & Paid
  - Shows: License Plate, Car Type, Wash Type, Price, Washer, Box Number, Times, Status
- **Record Actions:**
  - **Finish Now:** Available for unfinished records, sets end time
  - **Mark as Paid:** Admin only, opens payment method modal (Cash/Card)
  - **Edit:** Admin only, requires Master PIN, opens edit screen
  - **Delete:** Admin only, requires Master PIN, shows confirmation
- **Summary Footer:**
  - Displays three totals for filtered records:
    - Total Cash (sum of cash payments)
    - Total Card (sum of card payments)
    - Total Revenue (sum of all payments)

### 4.4 Admin Panel

#### 4.4.1 Pricing Management
- Grid/table interface showing Car Types (rows) × Wash Types (columns)
- Each cell contains editable price
- Save button updates entire pricing matrix
- Prices stored in database for persistence

#### 4.4.2 Company Management
- List view of all companies
- Add/Edit/Delete functionality
- Fields: Name, Contact Person
- Links to discount management
- Master PIN required for deletion

#### 4.4.3 Discount Management
- Shows discounts grouped by company
- "Physical Person" discounts (hardcoded, cannot delete)
- Company-specific discounts
- Add/Edit/Delete functionality
- Master PIN required for deletion
- Cannot delete discounts with associated wash records

#### 4.4.4 Vehicle Database
- Searchable list of all vehicles
- Shows: License Plate, Car Type, Linked Company
- Edit/Delete functionality
- Master PIN required for deletion
- Cannot delete vehicles with wash records

#### 4.4.5 Washer Management
- List of all washers
- Fields: Username, Name, Surname, Contact, Salary Percentage, Active Status
- Add/Edit/Delete functionality
- Master PIN required for deletion
- Active/Inactive status for filtering

#### 4.4.6 Type Configuration
- Manages Car Types and Wash Types
- Fields: Code, Display Name (Georgian), Display Name (English), Active Status, Sort Order
- Master PIN required for all operations
- Supports enabling/disabling types without deletion

#### 4.4.7 User Management
- List of all application users
- Shows: Email, Role (Admin/Staff), Name
- Add new users (Email, Password, Role)
- Reset password functionality
- Master PIN required for sensitive operations

---

## 5. Technical Implementation Details

### 5.1 Pricing Logic

```
Final_Price = Base_Price(CarType, WashType) × (1 - Discount_Percent / 100)
Washer_Cut = Final_Price × (Washer_Salary_Percentage / 100)
```

### 5.2 Master PIN System

- **Purpose:** Additional security layer for destructive operations
- **Location:** 
  - Frontend: Hardcoded in `src/utils/constants.ts` (currently '1234')
  - Backend: Stored in environment variable `MASTER_PIN`
- **Usage:** Required for:
  - Editing wash records
  - Deleting wash records
  - Deleting companies, discounts, vehicles, washers
  - Managing type configurations
- **Future:** Should be moved to secure environment variable on frontend

### 5.3 Data Persistence

- **Snapshot Data:** Wash records store snapshot data at time of creation:
  - License plate (in case vehicle is deleted)
  - Car category code
  - Company name
  - Discount percentage
  - Washer username
  - Wash type code
  - Custom service name (if applicable)
- **Relationships:** Records maintain foreign keys but also preserve snapshot data for historical accuracy

### 5.4 Internationalization

- **Supported Languages:** Georgian (ka) and English (en)
- **Implementation:** 
  - Translation files in `src/i18n/translations.ts`
  - Language context with AsyncStorage persistence
  - Bilingual labels for car types and wash types stored in database
- **Default Language:** Georgian

### 5.5 API Endpoints

**Authentication:**
- `POST /api/auth/login` - User login

**Records:**
- `GET /api/records` - List records (with date filtering)
- `POST /api/records` - Create new record
- `PUT /api/records/:id` - Update record (requires master PIN)
- `DELETE /api/records/:id` - Delete record (requires master PIN)

**Vehicles:**
- `GET /api/vehicles` - List/search vehicles
- `POST /api/vehicles` - Create vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle (requires master PIN)

**Companies:**
- `GET /api/companies` - List companies
- `POST /api/companies` - Create company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company (requires master PIN)

**Discounts:**
- `GET /api/discount-options` - List discounts
- `POST /api/discount-options` - Create discount
- `PUT /api/discount-options/:id` - Update discount
- `DELETE /api/discount-options/:id` - Delete discount (requires master PIN)

**Washers:**
- `GET /api/washers` - List washers
- `POST /api/washers` - Create washer
- `PUT /api/washers/:id` - Update washer
- `DELETE /api/washers/:id` - Delete washer (requires master PIN)

**Pricing:**
- `GET /api/pricing` - Get pricing matrix
- `POST /api/pricing` - Create/update pricing entry
- `PUT /api/pricing/:id` - Update pricing entry

**Types:**
- `GET /api/types/car-types` - List car types
- `POST /api/types/car-types` - Create car type (requires master PIN)
- `PUT /api/types/car-types/:id` - Update car type (requires master PIN)
- `DELETE /api/types/car-types/:id` - Delete car type (requires master PIN)
- Similar endpoints for wash types

**Users:**
- `GET /api/users` - List users (admin only)
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `POST /api/users/:id/reset-password` - Reset password (admin only)

---

## 6. Folder Structure

### 6.1 Frontend Structure

```
frontend/
├── app/                    # Expo Router routes
│   ├── (auth)/            # Authentication routes
│   │   └── index.tsx      # Login screen
│   ├── (app)/             # Protected app routes
│   │   ├── dashboard.tsx  # Dashboard screen
│   │   ├── new-record.tsx # New record creation
│   │   └── edit-record/   # Edit record screen
│   ├── (admin)/           # Admin-only routes
│   │   ├── pricing.tsx
│   │   ├── companies.tsx
│   │   ├── discounts.tsx
│   │   ├── vehicles.tsx
│   │   ├── washers.tsx
│   │   ├── types.tsx
│   │   └── appusers.tsx
│   └── _layout.tsx        # Root layout
├── src/
│   ├── components/        # Reusable UI components
│   ├── context/           # React Context providers
│   ├── services/          # API service functions
│   ├── utils/             # Utilities and constants
│   ├── hooks/             # Custom React hooks
│   └── i18n/              # Internationalization
└── package.json
```

### 6.2 Backend Structure

```
backend/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Database migrations
│   └── seed.js            # Database seeding
├── src/
│   ├── server.js          # Express server setup
│   ├── routes/            # API route handlers
│   ├── middleware/        # Custom middleware (auth, etc.)
│   └── utils/             # Utility functions
└── package.json
```

---

## 7. Security Considerations

### 7.1 Authentication Security
- Passwords hashed with bcryptjs
- JWT tokens with expiration
- Token stored securely on client
- Role-based access control enforced

### 7.2 API Security
- CORS configured for allowed origins
- Input validation on all endpoints
- SQL injection prevention via Prisma ORM
- Master PIN verification for sensitive operations
- Admin-only middleware for protected routes

### 7.3 Data Security
- Sensitive operations require Master PIN
- Audit trail through database timestamps
- Snapshot data preserved for historical records
- Foreign key constraints prevent orphaned data

---

## 8. Future Enhancements

### 8.1 Hardware Integration
- Bluetooth thermal printer support
- Receipt printing on payment completion
- Printer discovery and connection management

### 8.2 Security Enhancements
- Rate limiting for API endpoints
- Token refresh mechanism
- Enhanced password policies
- Audit logging system

### 8.3 Performance & UX
- Offline support with sync queue
- Pagination for large datasets
- Advanced filtering options
- Export functionality for reports

### 8.4 Testing & Quality
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical workflows
- Performance testing

---

## 9. Deployment Considerations

### 9.1 Backend Deployment
- PostgreSQL database setup
- Environment variables configuration
- SSL/TLS for API endpoints
- Monitoring and logging setup

### 9.2 Frontend Deployment
- Expo prebuild for native modules
- EAS Build for production APK/IPA
- App signing configuration
- Distribution to car wash staff

---

## 10. Notes

- **Master PIN:** Currently hardcoded in frontend constants. Should be moved to secure environment variable before production.
- **Database:** Uses Prisma migrations for schema versioning.
- **API Documentation:** Available at `/api-docs` endpoint (Swagger UI).
- **Internationalization:** Fully implemented for Georgian and English.
- **Status Colors:** Red (unfinished/unpaid), Orange (finished/unpaid), Green (finished/paid).

---

**Version:** 1.0  
**Last Updated:** 2025-02-04
