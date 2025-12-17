This specification outlines the requirements for a **React Native Android Application** for car wash management. The app is designed for tablets and phones, requiring a stable internet connection and utilizing **Firebase** as the backend.

---

# **Car Wash Management App Specification**

## **1. General Overview**

- **Platform:** Native Android Application (React Native).
- **Framework**: Expo (Managed Workflow with Expo Router).
- **Language**: TypeScript (.ts / .tsx).
- **Backend:** Firebase (Authentication & Realtime Database/Firestore).
- **Connectivity:** Online only (Internet connection required).
- **Printing:** Integration with Bluetooth Thermal Printers for receipts (Requires npx expo prebuild in final phase).
- **Security:** Role-based access (Admin vs. Regular Staff).

---

## **2. User Roles & Permissions**

### **A. Admin (Manager)**

- **Access:** Full access to all pages and features.
- **User Management:** Creates accounts for Staff; manually resets Staff passwords.
- **Record Management:** Can View, Edit, and Delete wash records.
  - _Security Note:_ Editing or Deleting a record requires entering a **hard-coded Master PIN** (known only to the boss).
- **Configuration:** Manages Pricing, Companies, Washers, and Vehicles.

### **B. Regular Staff**

- **Access:** Limited. Can Login and Create New Records.
- **Restrictions:**
  - Cannot view the Admin Panel (Page 3).
  - Cannot Edit or Delete existing records.
  - Cannot set Payment Status or End Time (Start Time is auto-set).

---

## **3. Functional Requirements**

### **Page 1: Authentication**

- **Login:** Email and Password fields.
- **Sign Up / Forgot Password:** **Hidden/Removed.**
  - _Workflow:_ Staff must contact the Admin to create an account or reset a password.

### **Page 2.1: Add New Record (Home Screen for Staff)**

- **Car License Number:**
  - Text input with **Search/Autocomplete** behavior based on the Vehicle Database.
  - _Logic:_ If an existing plate is found, auto-fill the **Car Type** and **Company**.
- **Car Type:**
  - **Hard-coded Dropdown:** Sedan, Jeep, Big Jeep, Premium, Hatchback, Minivan, Truck.
- **Company & Discount:**
  - **Dropdown:** Lists "Physical Person" options and Specific Company options.
  - _Example Options:_ "Physical Person 30%", "Physical Person 50%", "Company A 30%", "Company A 50%".
  - _Logic:_
    - "Physical Person" is a hard-coded category.
    - Company options are pulled from the Admin Panel configuration.
    - **Auto-Select:** If the License Plate is linked to a Company in the DB, auto-select that Company and default to the **lowest** available discount percentage.
- **Service Type:**
  - **Hard-coded Dropdown:** Complete Wash, Outer Wash, Engine Wash, etc.
- **Price (Read-Only):**
  - **Auto-Calculation:** `(Base Price for [Car Type + Service Type]) - (Discount Amount)`.
  - Field is locked; users cannot manually override the price.
- **Car Wash Box Number:**
  - Simple Dropdown (e.g., Box 1, Box 2...). No validation logic regarding occupancy.
- **Washer Name:**
  - Dropdown populated from the **Washer List** (managed in Admin Panel).
- **Start Date & Time:**
  - Automatically set to **Current Time** upon saving. Not editable by Staff.
- **End Date & Time:**
  - Hidden/Blank during creation.
- **Payment & Status:**
  - Hidden during creation. Defaults to "Unpaid/Unfinished".
- **Save Action:**
  - Creates the record in Firebase.
  - If the License Plate is new, automatically saves it to the **Vehicle Database** (linked to the selected Car Type and Company).

### **Page 2.2: Dashboard & Records List**

- **Default View:** Shows records for **Today** only.
- **Filters:** Date Range Picker (Start Date/Time to End Date/Time) to view history.
- **List Item Appearance (Color Coding):**
  - 🔴 **Red:** Unfinished & Unpaid.
  - 🟠 **Orange:** Finished but Unpaid (Ready for Payment).
  - 🟢 **Green:** Finished & Paid.
- **Record Actions:**
  - **Finish Now Button:** Updates "End Time" to current timestamp. Changes status from Red to Orange.
  - **Payment Action (Admin Only):**
    - User selects **Cash** or **Card**.
    - Status changes to **Green (Paid)**.
    - **Auto-Print:** Triggers Bluetooth Thermal Printer to print receipt.
  - **Edit / Delete (Admin Only):**
    - Clicking these buttons triggers a prompt for the **Master PIN**.
- **Footer Summary:**
  - Displays totals for the currently viewed range: **Total Cash | Total Card | Total Revenue**.

### **Page 3: Admin Panel (Restricted)**

- **1. Service Pricing Matrix:**
  - Interface to set the **Base Price** for every combination of [Car Type] + [Service Type].
- **2. Partner Companies:**
  - Add/Edit/Delete Companies.
  - Fields: Name, Contact Person, Email, Phone.
  - **Discounts:** Assign specific allowable discount percentages (e.g., Company A allows 30% and 50%).
- **3. Vehicle Database:**
  - View/Edit/Delete saved vehicles.
  - Fields: License Plate, Car Type, Linked Company (if any).
- **4. Washer Management:**
  - Simple list (Add/Remove names) to populate the "Washer Name" dropdown on Page 2.1.
- **5. Staff User Management:**
  - Create new App Users (Email/Password).
  - Reset passwords for existing users.
- **Removed:** "Customer Database" tab (not required).

---

## **4. Hardware Integration**

- **Bluetooth Thermal Printer:**
  - **Trigger:** Auto-prints when a record is marked as "Paid" (Green status).
  - **Receipt Content:**
    - Header: Car Wash Name & Logo.
    - Body: Date/Time, License Plate, Service Type, Final Price.
    - Footer: "Thank you".

---

## **5. Technical Logic & Data Structures**

- **Price Logic:**
  - `Final_Price = Base_Price(CarType, ServiceType) * (1 - Discount_Percent)`
- **Hard-Coded Lists (App Side):**
  - Car Types (Sedan, Jeep, Big Jeep, Premium, Hatchback, Minivan, Truck).
  - Service Types (Complete Wash, Outer Wash, Engine Wash, etc.).
  - Physical Person Category.
  - Master PIN (for Edit/Delete security).
- **Database (Firebase):**
  - **Users Collection:** Stores App login credentials and roles (Admin/Staff).
  - **Records Collection:** Stores wash logs (Plate, Times, Washer, Price, Status, Payment Method).
  - **Vehicles Collection:** Stores unique Plates, their Type, and Company Link.
  - **Companies Collection:** Stores Company metadata and allowed discount arrays.
  - **Pricing Collection:** Stores the price matrix.
  - **Washers Collection:** Simple list of names.

## **4. Technical Architecture**

- **Navigation:** **Expo Router** (File-based routing in the `app/` directory).
- **State Management:** React Context API (`AuthContext` for user session).
- **UI Library:** React Native Paper (Material Design 3).
- **Theme:** Custom Blue/White branding defined in `app/_layout.tsx`.

## **5. Folder Structure Strategy**

- **`app/`**: Contains only screens/routes.
  - `app/(auth)/`: Login routes (accessible when logged out).
  - `app/(app)/`: Protected routes (Dashboard, New Record).
  - `app/(admin)/`: Admin-only routes.
- **`src/`**: Contains all logic and reusable UI.
  - `src/components/`: Reusable UI (Forms, Cards, Lists).
  - `src/context/`: Auth state.
  - `src/services/`: Firebase & Printer logic.
  - `src/utils/`: Pricing logic, Constants, Types.
