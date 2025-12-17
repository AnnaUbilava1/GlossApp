Here is a comprehensive development plan designed to build your React Native Car Wash application. I have broken the project down into **7 Phases**, with granular, iterative prompts within each phase.

### **Development Strategy**

1.  **Foundation First:** We will establish the navigation and database connection immediately so every subsequent feature works "for real" rather than in a vacuum.
2.  **Logic Separation:** We will write the "Pricing Engine" and "Status Logic" as pure JavaScript functions first. This makes them easy to verify before connecting them to the UI.
3.  **Role-Based Access:** We will implement the Admin/Staff distinction early on to ensure security rules are baked in, not tacked on.
4.  **Hardware Last:** Bluetooth printing is complex. We will simulate the "Print" action with a console log/alert until the very end to keep the app development speed high.

---

### **Phase 1: Project Setup, Navigation & Authentication**

_Goal: Get the app running on the simulator, connected to Firebase, with a login screen that routes users based on their role (Admin vs. Staff)._

#### **Prompt 1: Project Initialization & Navigation**

```text
Create a new React Native project using the CLI (not Expo, as we need native Bluetooth support later).
Install `react-navigation` (Native Stack and Bottom Tabs) and `react-native-paper` for the UI component library.

Create a basic navigation structure:
1. `AuthStack`: Contains a 'LoginScreen'.
2. `AppStack`: Contains the main application.

In `App.js`, set up the NavigationContainer. For now, just have the 'LoginScreen' display a text "Login Screen" and a button that navigates to a placeholder 'HomeScreen' in the AppStack. Apply a clean, white/blue color theme using React Native Paper's theme provider.
```

#### **Prompt 2: Firebase Config & Auth Context**

```text
I need to integrate Firebase Authentication.
1. Create a `src/config/firebase.js` file (I will provide my own API keys later).
2. Create an `AuthContext` provider in `src/context/AuthContext.js`.
3. Implement a `signIn` function in the context that uses `auth().signInWithEmailAndPassword`.
4. In the `AuthContext`, track the `user` object and a `userRole` string (either 'admin' or 'staff'). For this step, you can just fetch the user role from a placeholder Firestore call or hardcode it based on the email domain for testing.
5. Update `App.js` to conditionally render `AuthStack` or `AppStack` based on whether `user` is present.
```

#### **Prompt 3: Login Screen UI**

```text
Build the actual UI for the `LoginScreen`.
1. Use React Native Paper components (TextInput, Button).
2. Fields: Email, Password.
3. Remove any "Sign Up" or "Forgot Password" links (as per requirements).
4. On submit, call the `signIn` function from `AuthContext`.
5. Add error handling: If login fails, show a Snackbar or Alert with the error message.
```

---

### **Phase 2: Data Modeling & Pricing Engine**

_Goal: Define the "Business Logic" regarding prices and status without worrying about the UI yet._

#### **Prompt 4: Pricing Logic Utility**

```text
Create a pure JavaScript utility file `src/utils/pricingCalculator.js`.
This file should contain:
1. Hardcoded arrays for `CAR_TYPES` (Sedan, Jeep, etc.) and `SERVICE_TYPES` (Complete, Outer, etc.).
2. A hardcoded `BASE_PRICES` object that maps a combination of CarType + ServiceType to a price.
3. A function `calculateWashPrice(carType, serviceType, discountPercent)` that returns the final price.
4. Write a simple test function at the bottom of the file that logs a few calculation scenarios to the console to verify it works.
```

#### **Prompt 5: Status Logic & Types**

```text
Create a utility file `src/utils/constants.js`.
Define the logic for record statuses:
1. `STATUS_COLORS`: Red (#FFCDD2) for Unpaid/Unfinished, Orange (#FFE0B2) for Finished/Unpaid, Green (#C8E6C9) for Paid/Finished.
2. Helper function `getStatusColor(isFinished, isPaid)` that returns the correct color code.
3. Helper function `getStatusLabel(isFinished, isPaid)` that returns a string (e.g., "In Progress", "Ready for Payment", "Completed").
```

---

### **Phase 3: Page 2.1 - Creating Records (The Staff View)**

_Goal: Allow staff to input data. This is the most complex form in the app._

#### **Prompt 6: New Record Form UI (Skeleton)**

```text
Create a new screen `NewRecordScreen` inside the `AppStack`.
Using React Native Paper, build a form with these fields:
1. `License Plate` (TextInput).
2. `Car Type` (Dropdown/Picker from constants).
3. `Service Type` (Dropdown/Picker from constants).
4. `Washer Name` (Dropdown - hardcode a few names for now).
5. `Box Number` (Dropdown - Box 1 to Box 5).
6. `Price` (TextInput, disabled/read-only).
7. `Company & Discount` (Dropdown). hardcode options like "Physical Person 30%", "Company A 30%".

Use the `pricingCalculator` utility to automatically update the `Price` field whenever Car Type, Service Type, or Discount changes.
```

#### **Prompt 7: Firestore Integration (Saving Records)**

```text
Now, let's connect the form to Firestore.
1. Create a `services/firestoreService.js` file.
2. Add a function `addRecord(data)`.
   - `data` should include: license, carType, serviceType, washerName, boxNumber, price, discount details.
   - Automatically set `startTime` to `firestore.FieldValue.serverTimestamp()`.
   - Set `isFinished: false`, `isPaid: false`.
   - Set `endTime: null`.
3. In `NewRecordScreen`, when the "Add Record" button is pressed, call this function.
4. On success, clear the form and show a success message.
```

#### **Prompt 8: License Plate Autocomplete Logic**

```text
Refine the `NewRecordScreen` logic for the License Plate field.
1. When the user types in the License Plate field, query the Firestore `vehicles` collection (we haven't created it yet, but write the query code).
2. If a match is found, auto-fill the `Car Type` dropdown.
3. Also check if the vehicle is linked to a Company. If so, auto-select that Company in the dropdown and apply their lowest available discount.
4. If no match is found, leave fields as they are.
```

---

### **Phase 4: Page 2.2 - Dashboard & Status Management**

_Goal: Display the list of cars and handle the workflow (Finish -> Pay)._

#### **Prompt 9: Dashboard UI & Fetching**

```text
Create `DashboardScreen`.
1. Fetch records from Firestore `records` collection.
2. Filter query: `where('startTime', '>=', start of today)`.
3. Display the records in a `FlatList`.
4. Create a `RecordItem` component for each row.
   - Display: License, Service, Box, Price, Time.
   - Background Color: Use the `getStatusColor` utility based on the record's status.
```

#### **Prompt 10: "Finish Now" Feature**

```text
Update the `RecordItem` component.
1. If the record is NOT finished (`isFinished: false`), show a "Finish Now" button.
2. When clicked, call a Firestore update function that sets `isFinished: true` and `endTime: firestore.FieldValue.serverTimestamp()`.
3. The row color should immediately change from Red to Orange (via real-time Firestore listener).
```

#### **Prompt 11: Payment Modal (Admin Only)**

```text
Add Payment logic to the `DashboardScreen`.
1. When an Admin clicks on an Orange record (Finished but Unpaid), open a "Payment Modal".
   - If the user is Staff, do nothing (or show "Permission Denied").
2. Modal content:
   - Total to Pay.
   - Buttons: "Cash" and "Card".
3. On selection, update Firestore: `isPaid: true`, `paymentMethod: 'cash' | 'card'`.
4. The row color should change to Green.
```

---

### **Phase 5: Admin Panel & Configuration**

_Goal: Build the configuration screens so the data isn't hardcoded._

#### **Prompt 12: Admin Navigation & Pricing Matrix**

```text
Create an `AdminPanelScreen`.
1. Ensure this screen is only accessible via the Navigation if `userRole === 'admin'`.
2. Create a Tab View or Segmented Control for: "Pricing", "Companies", "Washers", "Staff".
3. Implement the "Pricing" tab:
   - Fetch the pricing configuration from Firestore `config/pricing`.
   - Render a list of inputs allowing the Admin to edit the price for each CarType + ServiceType combination.
   - Save button updates Firestore.
   - Update `pricingCalculator.js` to use this context/state instead of hardcoded values.
```

#### **Prompt 13: Company & Washer Management**

```text
Implement the "Companies" and "Washers" tabs in `AdminPanelScreen`.
1. Companies: List view with Add/Edit/Delete.
   - Fields: Name, Contact, and an array of allowed discount percentages.
2. Washers: Simple list of names with Add/Delete.
3. Update the `NewRecordScreen` to populate its dropdowns from these Firestore collections instead of hardcoded data.
```

---

### **Phase 6: Advanced Logic & Security**

_Goal: Add the specific behavior requirements (Vehicle DB, Security PIN)._

#### **Prompt 14: Vehicle Database Auto-Save**

```text
Modify the `addRecord` logic in `firestoreService.js`.
1. When a new record is successfully added, trigger a secondary operation.
2. Check if this License Plate already exists in the `vehicles` collection.
3. If not, create a new document in `vehicles` with the License Plate, Car Type, and Company Link (if selected).
4. This ensures the Autocomplete feature in `NewRecordScreen` gets smarter over time.
```

#### **Prompt 15: Master PIN Security**

```text
Implement the Security PIN feature for Deleting/Editing.
1. Define a hardcoded constant `MASTER_PIN = "1234"` (or similar).
2. In `DashboardScreen`, add Edit (Pencil) and Delete (Trash) icons to the rows (Admin only).
3. Clicking them opens a prompt asking for the PIN.
4. If the PIN matches, allow the specific navigation to an Edit Screen or perform the Delete action.
```

---

### **Phase 7: Hardware & Polish**

_Goal: Bluetooth printing and final financial summaries._

#### **Prompt 16: Financial Summary Footer**

```text
In `DashboardScreen`, add a sticky footer.
1. Calculate totals from the visible records:
   - Total Cash (Sum of prices where isPaid=true and method=cash).
   - Total Card.
   - Total Revenue.
2. Display these numbers in a formatted bar at the bottom of the screen.
```

#### **Prompt 17: Bluetooth Thermal Printer Integration**

```text
Install `react-native-thermal-receipt-printer` (or a similar reliable library).
1. Create a `PrinterService.js`.
2. Implement a `printReceipt(record)` function.
   - Format the text: Header (Logo/Name), Body (Date, Plate, Service, Price), Footer (Thank you).
3. Hook this into the Payment Modal: When payment is successful, automatically call `printReceipt`.
4. Add a manual "Print Receipt" button to Green (Paid) records in the Dashboard for reprints.
```

#### **Prompt 18: Final Polish**

```text
1. Review the Date Picker filter on the Dashboard. Ensure it correctly queries Firestore for ranges.
2. Ensure the "Physical Person" logic in the Company dropdown is strictly enforced (hardcoded category).
3. Verify that Staff cannot access Page 3 (Admin Panel) or Payment buttons.
4. Run through the full flow: Login -> Create Record (Auto-save vehicle) -> Finish -> Pay (Print) -> Verify Totals.
```
