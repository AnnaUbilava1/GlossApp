# Car Wash App Checklist (Expo Router + TypeScript)

## 🛠 Phase 1: Project Setup & Authentication

### Developer A (UI & Routes)

- [ ] **Setup Theme**
  - [ ] Open `app/_layout.tsx`.
  - [ ] Configure `PaperProvider` with the Blue/White theme.
- [ ] **Create Route Groups**
  - [ ] Create folder `app/(auth)`.
  - [ ] Create folder `app/(app)`.
  - [ ] Create folder `app/(admin)`.
- [ ] **Login UI**
  - [ ] Create `app/(auth)/index.tsx` (Login Screen).
  - [ ] Build form (Email/Password) using React Native Paper.
  - [ ] _Note:_ Do not implement logic yet, just the UI.

### Developer B (Logic & Backend)

- [ ] **Firebase Init**
  - [ ] Install firebase packages.
  - [ ] Create `src/config/firebase.ts`.
- [ ] **Types Definition**
  - [ ] Create `src/utils/types.ts`.
  - [ ] Define interfaces: `UserRole`, `WashRecord`, `CarType`.
- [ ] **Auth Context & Protection**
  - [ ] Create `src/context/AuthContext.tsx`.
  - [ ] Implement `useAuth` hook.
  - [ ] Implement `signIn` function.
  - [ ] **Crucial:** Create a `useProtectedRoute` hook that listens to user state and performs `router.replace('/(auth)')` or `router.replace('/(app)')`.

---

## 🧠 Phase 2: Data Entry (Staff View)

### Developer A (Form UI)

- [ ] **New Record Screen**
  - [ ] Create `app/(app)/new-record.tsx`.
  - [ ] Fields: License, CarType, Service, Washer, Box, Company, Price.
- [ ] **Autocomplete Component**
  - [ ] Create `src/components/LicenseAutocomplete.tsx`.
  - [ ] Debounce input to query DB.
- [ ] **Wiring**
  - [ ] Use `usePricing` hook (from Dev B) to auto-update the Price field.

### Developer B (Business Logic)

- [ ] **Pricing Engine**
  - [ ] Create `src/utils/pricingCalculator.ts`.
  - [ ] Export `calculatePrice(carType, service, discount)`.
- [ ] **Firestore Service**
  - [ ] Create `src/services/firestoreService.ts`.
  - [ ] Implement `addRecord(data)`.
  - [ ] Implement `getVehicles(query)` for autocomplete.
- [ ] **Vehicle Auto-Save Logic**
  - [ ] Inside `addRecord`, check if vehicle exists. If not, create it.

---

## ⚙️ Phase 3: Dashboard & Admin Tools

### Developer A (Dashboard)

- [ ] **Dashboard List**
  - [ ] Create `app/(app)/dashboard.tsx`.
  - [ ] Implement `FlatList` fetching records for "Today".
- [ ] **Record Item UI**
  - [ ] Create `src/components/RecordItem.tsx`.
  - [ ] Apply background colors based on status props.
- [ ] **Date Filter**
  - [ ] Add a Date Range Picker to the Dashboard UI.

### Developer B (Admin & Actions)

- [ ] **Admin Screens**
  - [ ] Create `app/(admin)/pricing.tsx` (Edit Prices).
  - [ ] Create `app/(admin)/companies.tsx` (Manage Companies).
  - [ ] Create `app/(admin)/staff.tsx` (Manage Users).
- [ ] **Status Actions**
  - [ ] In `firestoreService.ts`, implement `updateStatus(id, newStatus)`.
- [ ] **Payment Logic**
  - [ ] Create `src/components/PaymentModal.tsx`.
  - [ ] Connect "Cash/Card" buttons to Firestore update.

---

## 🖨 Phase 4: Hardware & Prebuild (Final Steps)

### Joint Tasks

- [ ] **Prebuild**
  - [ ] Run `npx expo prebuild`.
  - [ ] (Dev B) Update `android/app/src/main/AndroidManifest.xml` for Bluetooth permissions if needed.
- [ ] **Bluetooth Printer**
  - [ ] (Dev B) Install printer library.
  - [ ] (Dev B) Create `src/services/printerService.ts`.
  - [ ] (Dev A) Add "Print Receipt" button to the Payment Modal.
