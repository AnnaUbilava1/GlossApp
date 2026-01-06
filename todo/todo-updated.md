# Car Wash App - Complete Development Checklist

## (Expo Router + TypeScript + Firebase)

---

## Phase 1: Project Setup & Authentication

### Developer A (UI & Routes)

- [x] **Setup Theme**
  - [x] Open `app/_layout.tsx`.
  - [x] Configure `PaperProvider` with the Blue/White theme (Material Design 3).
- [x] **Create Route Groups**
  - [x] Create folder `app/(auth)` - Login routes (accessible when logged out).
  - [x] Create folder `app/(app)` - Protected routes (Dashboard, New Record).
  - [x] Create folder `app/(admin)` - Admin-only routes.
- [x] **Login UI**
  - [x] Create `app/(auth)/index.tsx` (Login Screen).
  - [x] Build form (Email/Password) using React Native Paper.
  - [x] **Remove** Sign Up and Forgot Password options from UI.
  - [x] _Note:_ Do not implement logic yet, just the UI.

### Developer B (Logic & Backend)

- [ ] **Firebase Init**
  - [ ] Install firebase packages (`@react-native-firebase/app`, `@react-native-firebase/auth`, `@react-native-firebase/firestore`).
  - [ ] Create `src/config/firebase.ts`.
  - [ ] Initialize Firebase with your project credentials.
- [ ] **Constants & Hard-Coded Data**
  - [ ] Create `src/utils/constants.ts`.
  - [ ] Define `CAR_TYPES` array: `['Sedan', 'Jeep', 'Big Jeep', 'Premium', 'Hatchback', 'Minivan', 'Truck']`.
  - [ ] Define `SERVICE_TYPES` array: `['Complete Wash', 'Outer Wash', 'Engine Wash', 'Interior Clean', 'Wax & Polish']` (adjust as needed).
  - [ ] Define `BOX_NUMBERS` array: `['Box 1', 'Box 2', 'Box 3', 'Box 4']` (adjust as needed).
  - [ ] Define `MASTER_PIN` constant (e.g., `'1234'` - should be changed in production).
  - [ ] Define `PHYSICAL_PERSON` constant: `'Physical Person'`.
- [ ] **Types Definition**
  - [ ] Create `src/utils/types.ts`.
  - [ ] Define `UserRole` type: `'admin' | 'staff'`.
  - [ ] Define `PaymentMethod` type: `'cash' | 'card' | null`.
  - [ ] Define `RecordStatus` type: `'unfinished' | 'finished_unpaid' | 'paid'`.
  - [ ] Define `WashRecord` interface with all fields (id, licensePlate, carType, serviceType, company, discount, price, washerName, boxNumber, startTime, endTime, paymentMethod, status, createdBy).
  - [ ] Define `Vehicle` interface (licensePlate, carType, companyId).
  - [ ] Define `Company` interface (id, name, contactPerson, email, phone, allowedDiscounts: number[]).
  - [ ] Define `User` interface (uid, email, role).
  - [ ] Define `PricingMatrix` type (nested object: `{[carType]: {[serviceType]: number}}`).
- [ ] **Firebase Collections Setup**
  - [ ] Create initial Firestore structure:
    - `users` collection (uid, email, role).
    - `records` collection (wash logs).
    - `vehicles` collection (licensePlate, carType, companyId).
    - `companies` collection (name, contact info, allowedDiscounts).
    - `pricing` collection (single document storing the matrix).
    - `washers` collection (list of washer names).
  - [ ] Seed initial Admin user in Firebase Auth + Firestore.
- [ ] **Auth Context & Protection**
  - [ ] Create `src/context/AuthContext.tsx`.
  - [ ] Implement `useAuth` hook that exposes: `user`, `loading`, `signIn(email, password)`, `signOut()`.
  - [ ] Fetch user role from Firestore after authentication.
  - [ ] **Crucial:** Create a `useProtectedRoute` hook:
    - Listens to auth state.
    - If not authenticated: `router.replace('/(auth)')`.
    - If authenticated: `router.replace('/(app)/dashboard')`.
  - [ ] Implement role check: `isAdmin()` helper function.
- [ ] **Connect Login UI**
  - [ ] Wire `app/(auth)/index.tsx` to `signIn` function from AuthContext.
  - [ ] Handle loading and error states.

---

## 🧩 Phase 1.5: Shared Components & Utilities

### Developer A (Reusable UI Components)

- [ ] **Loading Indicator**
  - [ ] Create `src/components/LoadingSpinner.tsx`.
  - [ ] Use for full-screen loading states.
- [ ] **Error Display**
  - [ ] Create `src/components/ErrorMessage.tsx`.
  - [ ] Reusable component for showing error messages.
- [ ] **Master PIN Modal**
  - [ ] Create `src/components/MasterPinModal.tsx`.
  - [ ] Props: `visible`, `onDismiss`, `onCorrectPin`.
  - [ ] Input field for PIN entry.
  - [ ] Verify against `MASTER_PIN` constant.
  - [ ] Show error if PIN is incorrect.

### Developer B (Utility Functions)

- [ ] **Pricing Calculator**
  - [ ] Create `src/utils/pricingCalculator.ts`.
  - [ ] Export `calculatePrice(basePrice: number, discountPercent: number): number`.
  - [ ] Formula: `basePrice * (1 - discountPercent / 100)`.
- [ ] **Date Utilities**
  - [ ] Create `src/utils/dateUtils.ts`.
  - [ ] Export `getTodayRange()`: returns start and end timestamps for today.
  - [ ] Export `formatDateTime(date: Date): string` for display.
- [ ] **Firestore Service (Base)**
  - [ ] Create `src/services/firestoreService.ts`.
  - [ ] Export helper functions for common Firestore operations:
    - `getCollection(collectionName)`.
    - `getDocument(collectionName, docId)`.
    - `addDocument(collectionName, data)`.
    - `updateDocument(collectionName, docId, data)`.
    - `deleteDocument(collectionName, docId)`.

---

## ðŸ§ Phase 2: Data Entry (Staff View)

### Developer A (Form UI)

- [ ] **New Record Screen**
  - [ ] Create `app/(app)/new-record.tsx`.
  - [ ] Fields (using React Native Paper components):
    - License Plate (TextInput with autocomplete - see next task).
    - Car Type (Dropdown using constants).
    - Company & Discount (Combined dropdown - see logic below).
    - Service Type (Dropdown using constants).
    - Price (Read-only TextInput).
    - Box Number (Dropdown using constants).
    - Washer Name (Dropdown - fetched from Firestore).
  - [ ] **Hide** Start Time, End Time, Payment Method, and Status fields.
  - [ ] Add "Save" button at bottom.
- [ ] **License Plate Autocomplete**
  - [ ] Create `src/components/LicenseAutocomplete.tsx`.
  - [ ] Use `TextInput` with autocomplete dropdown.
  - [ ] Debounce input (300ms) to query `vehicles` collection.
  - [ ] On select: trigger callback with vehicle data (carType, companyId).
- [ ] **Company Dropdown Logic**
  - [ ] Create `src/components/CompanyDiscountPicker.tsx`.
  - [ ] Fetch companies from Firestore.
  - [ ] Generate options:
    - "Physical Person 30%", "Physical Person 50%" (hard-coded).
    - For each company: "Company Name 30%", "Company Name 50%", etc. (based on `allowedDiscounts` array).
  - [ ] Props: `selectedValue`, `onChange`, `autoSelectCompany` (for pre-filling from vehicle lookup).
  - [ ] When `autoSelectCompany` is set: auto-select that company with **lowest** discount.
- [ ] **Price Display**
  - [ ] Wire price calculation:
    - Listen to changes in Car Type, Service Type, and Discount.
    - Fetch base price from pricing matrix.
    - Use `calculatePrice` utility.
    - Update read-only Price field.

### Developer B (Business Logic & Data)

- [ ] **Firestore Service - Records**
  - [ ] In `src/services/firestoreService.ts`, implement:
    - `addRecord(data: WashRecord): Promise<string>` - Creates new record.
    - Auto-set `startTime` to current timestamp.
    - Auto-set `status` to `'unfinished'`.
    - Set `paymentMethod` to `null`.
    - Set `endTime` to `null`.
    - Return the new record ID.
- [ ] **Firestore Service - Vehicles**
  - [ ] Implement `searchVehicles(query: string): Promise<Vehicle[]>`.
  - [ ] Implement `getVehicle(licensePlate: string): Promise<Vehicle | null>`.
  - [ ] Implement `addVehicle(vehicle: Vehicle): Promise<void>`.
- [ ] **Auto-Save Vehicle Logic**
  - [ ] In `addRecord` function:
    - Check if vehicle exists using `getVehicle(licensePlate)`.
    - If not found: call `addVehicle` with licensePlate, carType, and companyId from form data.
- [ ] **Firestore Service - Companies & Washers**
  - [ ] Implement `getCompanies(): Promise<Company[]>`.
  - [ ] Implement `getWashers(): Promise<string[]>`.
- [ ] **Pricing Matrix Service**
  - [ ] Implement `getPricingMatrix(): Promise<PricingMatrix>`.
  - [ ] Implement `updatePricingMatrix(matrix: PricingMatrix): Promise<void>`.
- [ ] **Form Submission Handler**
  - [ ] Create `src/hooks/useNewRecord.ts`.
  - [ ] Implement form state management.
  - [ ] Validate all required fields.
  - [ ] Call `addRecord` and handle success/error.
  - [ ] Navigate to dashboard on success.

---

## 📊 Phase 3: Dashboard & Record Management

### Developer A (Dashboard UI)

- [ ] **Dashboard Screen**
  - [ ] Create `app/(app)/dashboard.tsx`.
  - [ ] Set as initial screen for authenticated users.
  - [ ] Implement Date Range Picker (default: Today).
  - [ ] Use React Native Paper `DataTable` or `FlatList` for records.
  - [ ] Show loading spinner while fetching.
- [ ] **Record Item Component**
  - [ ] Create `src/components/RecordItem.tsx`.
  - [ ] Display: License Plate, Car Type, Service, Price, Washer, Box, Times, Status.
  - [ ] Apply background colors:
    - 🔴 **Red (#FFCDD2)**: `status === 'unfinished'`.
    - 🟠 **Orange (#FFE0B2)**: `status === 'finished_unpaid'`.
    - 🟢 **Green (#C8E6C9)**: `status === 'paid'`.
  - [ ] Show action buttons based on status and user role:
    - **"Finish Now"** button (if status is `'unfinished'`).
    - **"Mark as Paid"** button (if status is `'finished_unpaid'` and user is Admin).
    - **Edit** button (Admin only, triggers PIN modal).
    - **Delete** button (Admin only, triggers PIN modal).
- [ ] **Dashboard Footer Summary**
  - [ ] Create `src/components/DashboardSummary.tsx`.
  - [ ] Display three totals: "Total Cash | Total Card | Total Revenue".
  - [ ] Calculate from currently filtered/visible records.
  - [ ] Update dynamically when date range changes.
- [ ] **Date Range Filter UI**
  - [ ] Add Start Date and End Date pickers at top of dashboard.
  - [ ] On change: fetch records for that range.

### Developer B (Dashboard Logic & Actions)

- [ ] **Firestore Service - Fetch Records**
  - [ ] Implement `getRecords(startDate: Date, endDate: Date): Promise<WashRecord[]>`.
  - [ ] Query records where `startTime` is between start and end.
  - [ ] Order by `startTime` descending.
- [ ] **Record Actions - Finish Now**
  - [ ] Implement `finishRecord(recordId: string): Promise<void>`.
  - [ ] Update `endTime` to current timestamp.
  - [ ] Change `status` from `'unfinished'` to `'finished_unpaid'`.
- [ ] **Record Actions - Mark as Paid**
  - [ ] Implement `markAsPaid(recordId: string, paymentMethod: PaymentMethod): Promise<void>`.
  - [ ] Update `paymentMethod` (cash or card).
  - [ ] Change `status` to `'paid'`.
  - [ ] Trigger printer service (see Phase 4).
- [ ] **Record Actions - Edit (with PIN)**
  - [ ] Implement `updateRecord(recordId: string, updates: Partial<WashRecord>): Promise<void>`.
  - [ ] Only callable after PIN verification.
  - [ ] Allow editing: carType, serviceType, price, company, discount, washerName, boxNumber.
- [ ] **Record Actions - Delete (with PIN)**
  - [ ] Implement `deleteRecord(recordId: string): Promise<void>`.
  - [ ] Only callable after PIN verification.
  - [ ] Soft delete (add `deleted: true` field) or hard delete based on preference.
- [ ] **Dashboard Hook**
  - [ ] Create `src/hooks/useDashboard.ts`.
  - [ ] Manage date range state.
  - [ ] Fetch records on mount and when date range changes.
  - [ ] Calculate summary totals (cash, card, total).
  - [ ] Return: `records`, `loading`, `error`, `summary`, `refreshRecords`.
- [ ] **Payment Modal Logic**
  - [ ] Create `src/components/PaymentModal.tsx`.
  - [ ] Props: `visible`, `onDismiss`, `onPayment(method: PaymentMethod)`.
  - [ ] Two buttons: "Cash" and "Card".
  - [ ] On selection: call `markAsPaid` and close modal.

---

## 🔐 Phase 3.5: Role-Based Access & Admin Guards

### Developer A (UI Guards)

- [ ] **Admin Route Protection**
  - [ ] In `app/(admin)/_layout.tsx`:
    - Check if user role is `'admin'`.
    - If not: redirect to `/(app)/dashboard`.
  - [ ] Hide Admin Panel navigation/links from Staff users.
- [ ] **Conditional Button Rendering**
  - [ ] In `RecordItem.tsx`:
    - Show Edit/Delete buttons only if `user.role === 'admin'`.
    - Show "Mark as Paid" only if `user.role === 'admin'`.

### Developer B (Backend Guards)

- [ ] **Firestore Security Rules**
  - [ ] Set up rules in Firebase Console:
    - Staff can only create records.
    - Staff can read records they created.
    - Admin can read/write/delete all records.
    - Only Admin can access `companies`, `pricing`, `washers` collections.
  - [ ] Document rules in `firestore.rules` file.

---

## ⚙️ Phase 4: Admin Panel

### Developer A (Admin UI Screens)

- [ ] **Admin Navigation**
  - [ ] Create `app/(admin)/_layout.tsx` with tabs or drawer navigation.
  - [ ] Links to: Pricing, Companies, Vehicles, Washers, Staff Management.
- [ ] **Pricing Matrix Screen**
  - [ ] Create `app/(admin)/pricing.tsx`.
  - [ ] Display a grid/table with Car Types (rows) and Service Types (columns).
  - [ ] Each cell: editable price input.
  - [ ] "Save Changes" button at bottom.
- [ ] **Companies Screen**
  - [ ] Create `app/(admin)/companies.tsx`.
  - [ ] List all companies with Edit/Delete buttons.
  - [ ] "Add New Company" button.
  - [ ] Create `src/components/CompanyFormModal.tsx`:
    - Fields: Name, Contact Person, Email, Phone.
    - Multi-select or checkboxes for Allowed Discounts (e.g., 10%, 20%, 30%, 50%).
    - Save button calls add/update function.
- [ ] **Vehicles Database Screen**
  - [ ] Create `app/(admin)/vehicles.tsx`.
  - [ ] Searchable list showing: License Plate, Car Type, Linked Company.
  - [ ] Edit/Delete buttons for each entry.
  - [ ] Create `src/components/VehicleFormModal.tsx` for editing.
- [ ] **Washers Management Screen**
  - [ ] Create `app/(admin)/washers.tsx`.
  - [ ] Simple list with Add/Remove buttons.
  - [ ] Text input to add new washer name.
- [ ] **Staff Management Screen**
  - [ ] Create `app/(admin)/staff.tsx`.
  - [ ] List all users (email, role).
  - [ ] "Add New User" button.
  - [ ] Create `src/components/StaffFormModal.tsx`:
    - Fields: Email, Password, Role (Admin/Staff).
    - Create account in Firebase Auth + Firestore.
  - [ ] "Reset Password" button for each user (triggers password reset email or manual reset).

### Developer B (Admin Logic & Services)

- [ ] **Company Management**
  - [ ] Implement `addCompany(company: Company): Promise<string>`.
  - [ ] Implement `updateCompany(companyId: string, updates: Partial<Company>): Promise<void>`.
  - [ ] Implement `deleteCompany(companyId: string): Promise<void>`.
- [ ] **Vehicle Management**
  - [ ] Implement `getAllVehicles(): Promise<Vehicle[]>`.
  - [ ] Implement `updateVehicle(licensePlate: string, updates: Partial<Vehicle>): Promise<void>`.
  - [ ] Implement `deleteVehicle(licensePlate: string): Promise<void>`.
- [ ] **Washer Management**
  - [ ] Implement `addWasher(name: string): Promise<void>`.
  - [ ] Implement `deleteWasher(name: string): Promise<void>`.
- [ ] **Pricing Matrix Management**
  - [ ] Wire up `updatePricingMatrix` to save button in pricing screen.
  - [ ] Validate all prices are positive numbers.
- [ ] **User Management (Admin)**
  - [ ] Implement `createStaffUser(email: string, password: string, role: UserRole): Promise<void>`.
  - [ ] Use Firebase Admin SDK or Cloud Function for secure user creation.
  - [ ] Implement `resetUserPassword(userId: string, newPassword: string): Promise<void>`.
  - [ ] Alternative: Send password reset email via Firebase Auth.

---

## 🖨️ Phase 5: Hardware Integration (Prebuild Required)

### Developer B (Prebuild & Bluetooth Setup)

- [ ] **Run Prebuild**
  - [ ] Execute `npx expo prebuild`.
  - [ ] This generates native `android/` and `ios/` folders.
- [ ] **Android Permissions**
  - [ ] Open `android/app/src/main/AndroidManifest.xml`.
  - [ ] Add permissions:
    ```xml
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    ```
- [ ] **Install Bluetooth Printer Library**
  - [ ] Install package (e.g., `react-native-thermal-receipt-printer` or `react-native-esc-pos-printer`).
  - [ ] Link native modules if needed.

### Developer B (Printer Service)

- [ ] **Printer Service**
  - [ ] Create `src/services/printerService.ts`.
  - [ ] Implement `discoverPrinters(): Promise<Printer[]>` - Scans for Bluetooth printers.
  - [ ] Implement `connectPrinter(printerId: string): Promise<void>`.
  - [ ] Implement `printReceipt(record: WashRecord): Promise<void>`:
    - Format receipt text:
      - Header: Car Wash Name & Logo (ASCII art or image).
      - Body: Date/Time, License Plate, Service Type, Final Price, Payment Method.
      - Footer: "Thank you for your visit!".
    - Send formatted data to printer.
  - [ ] Handle errors (printer not connected, paper out, etc.).
- [ ] **Auto-Print on Payment**
  - [ ] In `markAsPaid` function:
    - After updating Firestore, call `printReceipt(record)`.
    - Handle print failures gracefully (log error, show toast to user).

### Developer A (Printer Settings UI - Optional)

- [ ] **Printer Settings Screen**
  - [ ] Create `app/(admin)/printer-settings.tsx`.
  - [ ] Button to scan for printers.
  - [ ] List discovered printers with "Connect" button.
  - [ ] Show currently connected printer.
  - [ ] Test print button.

---

## ✅ Phase 6: Testing & Polish

### Joint Tasks

- [ ] **End-to-End Testing**
  - [ ] Test full Staff workflow: Login → Create Record → View in Dashboard → Finish Record.
  - [ ] Test Admin workflow: Edit Record (with PIN) → Delete Record (with PIN) → Mark as Paid → Print Receipt.
  - [ ] Test Vehicle autocomplete and auto-save.
  - [ ] Test Company discount auto-selection.
  - [ ] Test date range filtering on dashboard.
  - [ ] Test dashboard summary calculations.
- [ ] **Role-Based Access Testing**
  - [ ] Verify Staff cannot access Admin Panel.
  - [ ] Verify Staff cannot edit/delete records.
  - [ ] Verify Staff cannot mark records as paid.
- [ ] **Error Handling**
  - [ ] Test with no internet connection.
  - [ ] Test with invalid credentials.
  - [ ] Test printer failures.
  - [ ] Ensure all errors show user-friendly messages.
- [ ] **UI/UX Polish**
  - [ ] Ensure consistent theme across all screens.
  - [ ] Add loading states for all async operations.
  - [ ] Add confirmation dialogs for destructive actions (delete, etc.).
  - [ ] Test on different screen sizes (phones and tablets).
- [ ] **Performance**
  - [ ] Optimize Firestore queries (add indexes if needed).
  - [ ] Debounce autocomplete searches.
  - [ ] Lazy load large lists (pagination).
- [ ] **Documentation**
  - [ ] Write README with setup instructions.
  - [ ] Document Firebase structure and security rules.
  - [ ] Document Master PIN location (for future changes).
  - [ ] Create user guide for Staff and Admin.

---

## 🚀 Phase 7: Deployment

- [ ] **Build APK**
  - [ ] Run `eas build --platform android` (or use Android Studio).
  - [ ] Test APK on physical devices.
- [ ] **Firebase Deployment**
  - [ ] Deploy Firestore security rules.
  - [ ] Set up Firebase hosting for any web dashboards (if needed).
- [ ] **Distribution**
  - [ ] Distribute APK to car wash staff via email, Google Drive, or internal app store.
  - [ ] Provide training on app usage.

---

## 📋 Notes & Reminders

- **Master PIN**: Currently hard-coded in `src/utils/constants.ts` - Change before production.
- **Firebase Security**: Ensure Firestore rules are properly configured to prevent unauthorized access.
- **Backup Strategy**: Set up automated Firestore backups.
- **Update Strategy**: Plan for future app updates (new features, bug fixes).
- **Printer Compatibility**: Test with multiple thermal printer models to ensure compatibility.

---

**Legend:**

- `[ ]` = Not Started
- `[x]` = Completed
- _Italicized tasks_ = Critical path items
