# 🛒 Kiryana Hisaab (کِریانہ حساب) — Digital Ledger Book

**Kiryana Hisaab** (Kiryana OS) is a cloud-backed, offline-first, mobile-optimized web application designed specifically for local Pakistani grocery (*kiryana*) stores. It simplifies retail management by keeping track of customer debt (*udhaar*), cash reconciliation (*galla*), inventory stock, and supplier payables.

Built with a tactile **Ledger Book (Khata) aesthetic**, it bridges the gap between traditional paper bookkeeping and modern cloud synchronization, ensuring that shopkeepers can record sales instantly even with unreliable internet connections.

---

## 🎨 Design & UX Philosophy

The app is styled to feel like a traditional Pakistani accounting register (*Khata*):
*   **Ledger Book Theme**: Off-white ruled paper background (`stone-50` color palette), dark black ink text, emerald green for cash, and crimson red for outstanding debt.
*   **Localized Typography**: Integrates Google Fonts' **Noto Sans** for clean interface elements, **JetBrains Mono** for tabulating currency figures, and **Noto Nastaliq Urdu** for authentic Right-to-Left (RTL) Urdu branding.
*   **Mobile-First Container**: Rigid layout bounds (`max-w-md` width) replicating a native Android application utility, ideal for handheld use by shop owners and helpers.

---

## ⚡ Tech Stack

*   **Frontend**: React (v18) + TypeScript + Vite
*   **Styling**: Tailwind CSS + Shadcn UI Components
*   **State Management**: Zustand (ephemeral UI state & shopping cart)
*   **Local Database**: Dexie.js (wrapper for browser-native **IndexedDB**)
*   **Cloud Backend**: Appwrite (Database, File Storage & User Management)
*   **Synchronization**: Custom Dexie table hooks triggers background upserts/deletes to Appwrite Cloud
*   **Testing**: Vitest for unit tests

---

## 🚀 Key Features

### 👦 Chota (Cashier/Helper) Mode
Designed for quick checkouts by shop assistants or helper boys. It features:
*   **Interactive Item Grid**: Visual tiles showing product emojis or uploaded product images, filterable by categories.
*   **Tap-to-Add Cart**: Simple counter interface to increase or decrease items quickly.
*   **Dual Checkout Options**:
    *   `🟢 CASH` (Naqad): Instantly records the cash sale transaction.
    *   `🔴 UDHAAR` (Credit): Opens a customer selector to assign the bill to an existing customer ledger.
*   **Information Hierarchy**: Financial dashboards, profits, and supplier logs are hidden to maintain business confidentiality.
*   **View-only Inventory**: A simple list showing current stock, flagged with `⚠️ Kam Stock` warnings for items with 2 or fewer units.

### 👨 Maalik (Owner) Mode
The administrative center of the application, featuring:
1.  **📊 Hisaab (Analytics Dashboard)**:
    *   Real-time metrics: Net Cash, Approx Munafa (Profit), Logon ka Udhaar (Receivables), and Supplier ko Dena (Payables).
    *   Expandable multi-layer breakdown of accounts.
    *   Date filtering via a popover calendar selector to inspect historical logs.
2.  **🧾 Aaj (Today's Sale & Reconciliation)**:
    *   Displays today's total sales, split by Cash and Udhaar.
    *   **Galla Check**: Let the owner input the physical cash in the cash drawer (*galla*). The app automatically calculates a live difference (*Faraq*) indicating whether the cash drawer is matched (`✅ Theek hai`), short (`🔴 Kam hai`), or over (`🟢 Zyada hai`).
    *   Manual cash entries can be recorded directly.
3.  **👥 Udhaar (Receivables Ledger)**:
    *   Lists all customers with outstanding credit balances.
    *   Displays how many days have elapsed since their oldest unpaid transaction.
    *   **Wasool Karo** (Collect Payment) utility to deduct paid amount from a customer's balance.
    *   **Yaad Dilao (WhatsApp Reminders)**: One-tap button that prepares and triggers a friendly reminder message in Urdu via WhatsApp API (`https://wa.me/92...`).
4.  **🚛 Supplier Hisaab (Payables)**:
    *   Tracks wholesale accounts.
    *   Record credit purchases (stock received on credit), cash purchases (paid immediately), or old debt payments.
5.  **📦 Inventory Management**:
    *   Add, edit, or delete items.
    *   Upload images to **Appwrite Storage** with automatic client-side canvas compression.
    *   *Robust Failover*: If Appwrite cloud upload fails due to network issues, the app compresses the image and falls back to saving a base64 Data URL locally in IndexedDB, syncing it later.

---

## 🔄 Synchronization Mechanism

The app runs on an **Offline-First** model:
1.  All data is stored and read locally in the browser's IndexedDB using **Dexie.js**.
2.  Dexie hooks (`creating`, `updating`, and `deleting`) are hooked into the database tables. Any local change automatically schedules a background API request to Appwrite via `syncToCloud` or `deleteFromCloud`.
3.  On app boot, `pullAllFromCloud` downloads all cloud documents, deduplicates records based on uniqueness hashes (such as matching phone numbers or transaction profiles), and updates the local IndexedDB.

---

## 🛠️ Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   An Appwrite Cloud account (or local Appwrite instance)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/hasnaatmalik/kiryana-hisaab.git
cd kiryana-hisaab
npm install
```

### 2. Configure Appwrite Database
To save you from manual dashboard creation, an automated script is provided in the `scripts` directory.
1.  Create a project on your [Appwrite Console](https://cloud.appwrite.io).
2.  Create an API Key under the project's **Integrations** tab with the following scopes:
    *   `databases` (all scopes)
    *   `buckets` (all scopes)
    *   `files` (all scopes)
3.  Run the initializer script:
    ```bash
    node scripts/init-appwrite.js
    ```
4.  Follow the prompts to supply your Project ID and API Key. The script will:
    *   Provision a database named `KiryanaHisaab`.
    *   Create collections for `customers`, `suppliers`, `items`, and `transactions`.
    *   Set up all attributes, types, and permissions (`Role.any()` read/write for demo purposes).
    *   Create an `ItemImages` storage bucket.
    *   Generate a `.env.local` containing all configured environment variables.

### 3. Local Development
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. The app will automatically seed the local IndexedDB with mock items (Tapal, Olpers, Lays), dummy customers, and realistic transactions if it's your first time loading.

### 4. Running Tests
```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

---

## 📁 Directory Structure

```
kiryana-hisaab/
├── scripts/
│   └── init-appwrite.js     # CLI schema provisioning script
├── src/
│   ├── components/
│   │   ├── ChotaMode/       # Cashier screen: ItemGrid, Cart, CheckoutBar
│   │   ├── OwnerMode/       # Owner tabs: Dashboard, Inventory, SupplierList, UdhaarList
│   │   └── shared/          # Reusable Modals, ModePicker, SwitchModeDialog, Flash alerts
│   │   └── ui/              # Shadcn components (Toaster, Calendar, Dialog)
│   ├── lib/
│   │   ├── appwrite.ts      # Appwrite Client SDK instantiation
│   │   ├── format.ts        # PKR currency formatting helper
│   │   └── sync.ts          # Core Dexie <-> Appwrite synchronization engine
│   ├── pages/
│   │   ├── Index.tsx        # View switcher wrapper (Picker vs Chota vs Owner)
│   │   └── NotFound.tsx     # 404 Fallback
│   ├── db.ts                # Dexie database definitions & table hooks
│   ├── seed.ts              # Pakistani grocery database seed data
│   ├── store.ts             # Zustand UI state store (cart state, active mode)
│   ├── index.css            # Base stylesheet containing paper theme styles
│   └── main.tsx             # Vite mount root
├── package.json             # NPM dependencies & task runners
├── tailwind.config.ts       # Theme configuration
└── vite.config.ts           # Bundler split-chunk optimization setup
```

---

## 🗄️ Data Models

### Customers (`customers`)
```typescript
interface Customer {
  id?: number;              // Auto-increment primary key
  name: string;             // Customer name
  phone: string;            // 11-digit phone number (without country code)
  balance: number;          // Current outstanding balance in PKR
  default_due_days: number; // Days allowed to clear bills (default: 10/15/30)
  risk_status: "good" | "risky"; 
}
```

### Suppliers (`suppliers`)
```typescript
interface Supplier {
  id?: number;
  name: string;             // Supplier company name
  payable_balance: number;  // Dues owed to this supplier
}
```

### Items (`items`)
```typescript
interface Item {
  id?: number;
  name: string;             // Product name
  price: number;            // Retail price
  emoji: string;            // Icon placeholder
  category: string;         // Category filter (e.g. dairy, grocery, snack)
  description?: string;     // Product notes (pack size, weight)
  image_url?: string;       // Cloud URL (or local Base64 fallback)
}
```

### Transactions (`transactions`)
```typescript
interface Transaction {
  id?: number;
  type: "cash_sale" | "udhaar_given" | "udhaar_recovered" | "supplier_credit_received" | "supplier_paid";
  amount: number;           // Value in PKR
  related_id?: number;      // Customer ID or Supplier ID reference
  date: string;             // ISO-8601 Timestamp
  description: string;      // Detail summary (e.g., checkout items list)
}
```