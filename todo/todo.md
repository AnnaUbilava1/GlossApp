# Car Wash App Development Checklist

## Phase 0: Android

- [ ] Android Studio, SDK, emulator, and Build Tools
- [ ] Environment variables and path
- [ ] etc.

## Phase 1: Project Setup, Navigation & Authentication

- [ ] **Initialize Project**
  - [x] Create new React Native CLI project (ensure native modules support).
  - [x] Install dependencies: `react-navigation` (Native Stack & Bottom Tabs), `react-native-safe-area-context`, `react-native-screens`.
  - [x] Install UI Library: `react-native-paper` and `react-native-vector-icons`.
  - [x] Setup Theme: Configure a clean Blue/White theme in `App.js` using PaperProvider.
- [ ] **Navigation Structure**
  - [ ] Create `AuthStack` (LoginScreen).
  - [ ] Create `AppStack` (Main Application with Bottom Tabs).
  - [ ] Implement conditional routing in `App.js` based on user login state.
- [ ] **Firebase Configuration**
  - [ ] Create Firebase Project in Console.
  - [ ] Add Android app to Firebase Console and download `google-services.json`.
  - [ ] Install `@react-native-firebase/app`, `@react-native-firebase/auth`, `@react-native-firebase/firestore`.
  - [ ] Configure `src/config/firebase.js`.
- [ ] **Authentication Logic**
  - [ ] Create `src/context/AuthContext.js`.
  - [ ] Implement `signIn` function.
  - [ ] Implement `signOut` function.
  - [ ] Create state for `user` object and `userRole` (admin vs. staff).
- [ ] **Login Screen UI**
  - [ ] Build UI with Email and Password inputs.
  - [ ] Remove "Sign Up" and "Forgot Password" links (Admin only).
  - [ ] Connect Submit button to `AuthContext.signIn`.
  - [ ] Add error handling (Alert/Snackbar on failure).

## Phase 2: Business Logic & Data Models (No UI)

- [ ] **Pricing Engine**
  - [ ] Create `src/utils/pricingCalculator.js`.
  - [ ] Define hardcoded `CAR_TYPES` array.
  - [ ] Define hardcoded `SERVICE_TYPES` array.
  - [ ] Define `BASE_PRICES` object (Matrix of CarType + ServiceType).
  - [ ] Write `calculateWashPrice(carType, serviceType, discount)` function.
  - [ ] Verify logic with console logs/unit tests.
- [ ] **Status & Constants**
  - [ ] Create `src/utils/constants.js`.
  - [ ] Define `STATUS_COLORS` (Red, Orange, Green).
  - [ ] Create helper `getStatusColor(isFinished, isPaid)`.
  - [ ] Create helper `getStatusLabel(isFinished, isPaid)`.

## Phase 3: Page 2.1 - Creating Records (Staff View)

- [ ] **New Record Screen UI**
  - [ ] Create `NewRecordScreen.js`.
  - [ ] Implement Layout:
    - [ ] License Plate (TextInput).
    - [ ] Car Type (Dropdown from constants).
    - [ ] Service Type (Dropdown from constants).
    - [ ] Washer Name (Dropdown - temp hardcoded).
    - [ ] Box Number (Dropdown 1-5).
    - [ ] Company & Discount (Dropdown - incl. "Physical Person").
    - [ ] Price (Read-only TextInput).
- [ ] **Reactive Pricing Logic**
  - [ ] Wire up `pricingCalculator` to update the Price field automatically when Dropdowns change.
- [ ] **Firestore Service - Create**
  - [ ] Create `src/services/firestoreService.js`.
  - [ ] Implement `addRecord(data)` function.
    - [ ] Auto-set `startTime` to server timestamp.
    - [ ] Default `isFinished: false`, `isPaid: false`.
    - [ ] Connect "Save" button in UI to this function.
- [ ] **License Plate Autocomplete**
  - [ ] Implement logic to query `vehicles` collection on text change (debounce).
  - [ ] If match found: Auto-fill Car Type.
  - [ ] If match has Company Link: Auto-select Company & Default Discount.

## Phase 4: Page 2.2 - Dashboard & Status Management

- [ ] **Dashboard Screen UI**
  - [ ] Create `DashboardScreen.js`.
  - [ ] Set up Firestore query: Fetch `records` where `startTime` >= Today.
  - [ ] Implement `FlatList` to display records.
- [ ] **Record Item Component**
  - [ ] Create `RecordItem.js`.
  - [ ] Display: Plate, Time, Service, Box, Price.
  - [ ] Apply Dynamic Background Color (Red/Orange/Green) using `constants.js`.
- [ ] **Finish Workflow**
  - [ ] Add "Finish Now" button to Red (Unfinished) rows.
  - [ ] Implement `markAsFinished(id)` in `firestoreService.js`.
    - [ ] Sets `isFinished: true`, `endTime: serverTimestamp`.
- [ ] **Payment Workflow (Admin Only)**
  - [ ] Create Payment Modal.
  - [ ] Show Modal only if `userRole === 'admin'` and status is Orange.
  - [ ] Add "Cash" and "Card" buttons.
  - [ ] Implement `markAsPaid(id, method)` in `firestoreService.js`.
    - [ ] Sets `isPaid: true`.

## Phase 5: Admin Panel & Configuration

- [ ] **Admin Navigation**
  - [ ] Create `AdminPanelScreen.js`.
  - [ ] Add protection: Redirect if `userRole !== 'admin'`.
  - [ ] Create Tabs: Pricing, Companies, Washers, Staff.
- [ ] **Pricing Configuration**
  - [ ] Fetch Pricing Matrix from Firestore (replace hardcoded logic in `pricingCalculator`).
  - [ ] Build UI to edit Base Prices.
- [ ] **Company Management**
  - [ ] Build CRUD UI for Companies (Name, Contact, Discount Arrays).
  - [ ] Update `NewRecordScreen` to fetch Companies from Firestore.
- [ ] **Washer Management**
  - [ ] Build simple List UI to Add/Remove Washer names.
  - [ ] Update `NewRecordScreen` to fetch Washers from Firestore.
- [ ] **Staff User Management**
  - [ ] Build UI to Create new Staff (Email/Password).
  - [ ] Use Firebase Admin SDK (or Cloud Functions) for account creation if client-side creation is restricted, OR use secondary Auth app (simpler: use standard auth for now, restrict via DB rules).

## Phase 6: Advanced Logic & Security

- [ ] **Vehicle Database Logic**
  - [ ] Update `addRecord` service.
  - [ ] Check if Plate exists in `vehicles`.
  - [ ] If new: Create document in `vehicles` with Plate, Car Type, and Company Link.
- [ ] **Security PIN**
  - [ ] Define `MASTER_PIN` in constants.
  - [ ] Add Edit/Delete icons to Dashboard rows (Admin only).
  - [ ] Create PIN Prompt Modal.
  - [ ] Only execute Edit/Delete function if PIN matches.

## Phase 7: Hardware & Final Polish

- [ ] **Financial Summary**
  - [ ] Add Sticky Footer to Dashboard.
  - [ ] Calculate logic: Sum Cash, Sum Card, Sum Total for visible records.
- [ ] **Bluetooth Printer**
  - [ ] Install `react-native-thermal-receipt-printer` (or equivalent).
  - [ ] Create `src/services/printerService.js`.
  - [ ] Design Receipt Layout (Logo, Time, Details, Footer).
  - [ ] Trigger print automatically on "Mark as Paid".
  - [ ] Add manual "Print Receipt" button for Green records.
- [ ] **Date Filtering**
  - [ ] Add Date Picker to Dashboard Header.
  - [ ] Update Firestore query to respect selected range (Start/End).
- [ ] **Final Testing**
  - [ ] Test Offline behavior (graceful handling).
  - [ ] Test Staff vs Admin permissions strictly.
  - [ ] Test Auto-calculation of prices.
