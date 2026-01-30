# GlossApp – Remaining Work Checklist

> This file lists **only what's left** to get the app feature‑complete and production‑ready, based on the current Express/Prisma backend and Expo frontend. Tick items as you complete them.

---

## 1. Authentication, Routing & Roles

- [x] **Auth routing guard**
  - [x] Implement a `useProtectedRoute` hook that:
    - [x] Sends unauthenticated users to `/(auth)` (login).
    - [x] Sends authenticated users to `/(app)` or `/(admin)` by default (based on role).
  - [x] Wire it into the root layout so it runs on app start.
- [x] **Role awareness in frontend**
  - [x] Ensure `AuthContext` exposes `user.role` from backend.
  - [x] Hide all `/(admin)` navigation for non‑admins (via `showAdminButton={auth.user?.role === "admin"}`).
  - [x] If a staff user hits an admin route, redirect to dashboard (handled in `useProtectedRoute`).

---

## 2. Staff Data Entry – New Record Flow

- [x] **New Record screen**
  - [x] Implement `app/(app)/new-record.tsx` (UI using React Native Paper).
  - [x] Fields:
    - [x] License Plate (TextInput with autocomplete). _(Implemented via `LicenseAutocomplete` component.)_
    - [x] Car Type (dropdown using `CAR_TYPES`).
    - [x] Company & Discount selector (using `/api/discount-options`).
    - [x] Service Type (dropdown using `SERVICE_TYPES`).
    - [x] Price (read‑only, via pricing quote API).
    - [x] Box Number (input, mapped to DB `box_number`).
    - [x] Washer (dropdown from backend `/api/washers`).
  - [x] Hide start/end time, payment, and status fields from the UI. _(Payment method select removed; payment is handled later by admin.)_
  - [x] Add a **Save** button that posts to `/api/records`.
- [x] **License plate autocomplete**
  - [x] Create `src/components/LicenseAutocomplete.tsx`.
  - [x] Debounce input and call a backend endpoint to search vehicles (`/api/vehicles`).
  - [x] On select, populate license plate; user can still adjust car type/company manually.
- [x] **Company & discount picker**
  - [ ] (Optional) Extract current logic into a reusable `src/components/CompanyDiscountPicker.tsx`.
  - [x] Fetch discount options from backend `/api/discount-options`.
  - [x] Generate options for:
    - [x] Physical person discounts (30%, 50%) – added in backend route.
    - [x] Per‑company discounts from `discounts` table.
  - [ ] Support auto‑select based on vehicle lookup.
- [x] **Price calculation**
  - [ ] (Optional) Extract math into `src/utils/pricingCalculator.ts` for reuse.
  - [x] Use backend `/api/pricing/quote` endpoint for pricing logic.
  - [x] When car type / service type / discount / washer change:
    - [x] Request quote from `/api/pricing/quote`.
    - [x] Apply discount (handled by backend).
    - [x] Update the read‑only Original Price, Discounted Price, and Washer Cut fields in `new-record.tsx`.
- [x] **Record submission**
  - [x] Validate all required fields before POST. *(Done in `handleAddRecord` in `new-record.tsx` with detailed checks and error messages.)*
  - [x] Call `/api/records` with the legacy‑friendly payload (as in current backend comments). *(Uses `licenseNumber`, `carType`, `serviceType`, `washerId`, `companyId`, `discountPercent`, `boxNumber`.)*
  - [x] Show success / error messages. *(Sets `error` state on failure.)*
  - [x] On success, navigate to dashboard. *(Calls `router.push("/(app)/dashboard")` on success.)*

---

## 3. Dashboard & Record Management

- [x] **Dashboard screen**
  - [x] Implement `app/(app)/dashboard.tsx`.
  - [ ] Set it as the initial screen for logged‑in users. *(Currently `/(app)` redirects to `new-record` by design.)*
  - [x] Add date range filter UI (default = today). *(Start/End date text inputs wired to `/api/records?startDate=&endDate=` via `useDashboard`.)*
  - [x] Fetch records from `/api/records`.
  - [x] Show loading + error states. *(Uses `loading` + `error` state with inline text; can be refined later.)*
  - [x] Render list/table of records. *(DataTable on tablet, cards on mobile.)*
- [x] **Record item component**
  - [x] Create `src/components/RecordItem.tsx`.
  - [x] Show plate, car type, service, price, washer, box, times, status (table row version).
  - [x] Apply status colors (red/orange/green) based on DB fields.
  - [x] Buttons:
    - [x] "Finish Now" (for unfinished records).
    - [x] "Mark as Paid" (for finished_unpaid, admin only).
    - [x] Edit (admin only, with PIN). *(Handler still TODO to call backend with PIN.)*
    - [x] Delete (admin only, with PIN). *(Handler still TODO to call backend with PIN.)*
- [x] **Dashboard summary**
  - [x] Create `src/components/DashboardSummary.tsx`.
  - [x] Compute totals: cash, card, overall revenue for current filter (based on `paymentMethod` + `isPaid`).
  - [x] Update when date range changes. *(Totals recomputed from `records` in `useDashboard`.)*
- [x] **Dashboard logic hook**
  - [x] Create `src/hooks/useDashboard.ts`.
  - [x] Manage date range + fetching, loading, error.
  - [x] Expose records and summary values.
- [x] **Record actions (backend + frontend)**
  - [x] Backend: ensure endpoints for:
    - [x] Mark record finished (set endTime + status). *(Implemented as `POST /api/records/{id}/finish`.)*
    - [x] Mark record paid (set paymentMethod + status). *(Implemented as `POST /api/records/{id}/pay`, admin only.)*
    - [x] Edit record (with master PIN). *(Already implemented via `PUT /api/records/{id}` with `masterPin`, admin only.)*
    - [x] Delete record (with master PIN). *(Already implemented via `DELETE /api/records/{id}` with `masterPin`, admin only.)*
  - [x] Frontend:
    - [x] Wire **Finish** and **Pay** buttons to the above endpoints in `dashboard.tsx`.
    - [ ] Use `MasterPinModal` before edit/delete (records). *(Still TODO – users screen already uses it.)*
    - [x] Refresh dashboard after actions. *(Records refetched via `useDashboard` by nudging date state.)*

---

## 4. Admin Configuration Screens

- [x] **Pricing**
  - [x] Finish `app/(admin)/pricing.tsx`:
    - [x] Fetch pricing matrix from `/api/pricing`.
    - [x] Render editable grid of car types × wash types.
    - [x] Validate entries are positive numbers.
    - [x] Call PUT `/api/pricing` to save.
- [x] **Washers**
  - [x] Finish `app/(admin)/washers.tsx` to use real data:
    - [x] Fetch washers from `/api/washers`.
    - [x] Implement "Add washer" (POST).
    - [x] Implement "Deactivate/remove washer" (or delete endpoint).
    - [x] Refresh list on change.
- [x] **Companies**
  - [x] Implement backend routes for companies (CRUD).
  - [x] Wire `app/(admin)/companies.tsx` to:
    - [x] Fetch companies.
    - [x] Add / edit / delete via modals.
    - [x] Persist allowed discount options.
- [x] **Vehicles**
  - [x] Implement backend routes for vehicles (list, search, update, delete).
  - [x] Wire `app/(admin)/vehicles.tsx` to:
    - [x] Search by license plate.
    - [x] Edit linked company/car type.
    - [x] Delete / clean up if needed.
- [x] **Discount options (if separate)**
  - [x] Expose discount options via backend route (`/api/discount-options` already exists).
  - [x] Wire `app/(admin)/discounts.tsx` to manage those options if needed.

---

## 5. Role‑Based Access & Security

- [x] **Frontend admin guards**
  - [x] In `app/(admin)/_layout.tsx`, redirect non‑admins to dashboard.
  - [x] Hide admin tabs/buttons for staff users. *(Handled via `showAdminButton={auth.user?.role === "admin"}` in `AppHeader`.)*
  - [x] In record components, only show Edit/Delete/Mark‑as‑Paid for admins.
- [x] **Master PIN usage**
  - [x] Ensure all destructive / sensitive actions (record edit/delete, user password reset/delete, etc.) go through `MasterPinModal`.
  - [x] Confirm backend always checks `process.env.MASTER_PIN` for those endpoints.
- [x] **Backend guards**
  - [x] Confirm all admin APIs use `authenticateToken` + `requireAdmin`.
  - [x] Add any missing checks for records, pricing, companies, vehicles, washers.

---

## 6. Printing & Hardware (Optional but in spec)

- [ ] **Prebuild & setup**
  - [ ] Run `npx expo prebuild` and commit native folders if required.
  - [ ] Add Android Bluetooth permissions.
  - [ ] Install and configure a Bluetooth printer library.
- [ ] **Printer service**
  - [ ] Implement `src/services/printerService.ts` with:
    - [ ] `discoverPrinters()`
    - [ ] `connectPrinter(id)`
    - [ ] `printReceipt(record)` – format text and send to printer.
  - [ ] Handle printer errors gracefully.
- [ ] **Printer settings UI (admin)**
  - [ ] Implement optional `app/(admin)/printer-settings.tsx`.
  - [ ] Scan, connect, and test print from UI.
- [ ] **Auto‑print on payment**
  - [ ] After successful "Mark as Paid", trigger `printReceipt` for that record.

---

## 7. Testing, Polish & Deployment

- [ ] **End‑to‑end testing**
  - [ ] Staff flow: Login → New Record → See in Dashboard → Finish → (Admin) Mark as Paid.
  - [ ] Admin flow: Edit / Delete record with PIN, manage users, pricing, washers, companies.
  - [ ] Test vehicle autocomplete and company discount logic.
  - [ ] Test dashboard filtering and summaries.
- [ ] **Role tests**
  - [ ] Confirm staff cannot access admin panel or admin actions.
  - [ ] Confirm admin can access all required features.
- [ ] **Error handling & UX**
  - [ ] Ensure all API errors show friendly messages.
  - [ ] Add loading indicators for all async actions.
  - [ ] Add confirmation dialogs for destructive actions.
  - [ ] Verify layout on phones and tablets.
- [ ] **Performance**
  - [ ] Check backend queries for obvious inefficiencies.
  - [ ] Debounce network‑heavy inputs (autocomplete).
  - [ ] Add pagination or lazy loading where lists can grow.
- [ ] **Docs & deployment**
  - [ ] Update README with backend/frontend setup steps.
  - [ ] Document environment variables (including `MASTER_PIN`).
  - [ ] Document database schema and main flows.
  - [ ] Build APK (`eas build --platform android` or similar) and test on real devices.
  - [ ] Distribute APK and write a short user guide for staff and admin.
