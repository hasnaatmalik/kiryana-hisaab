# CLAUDE.md — Kiryana-Hisaab

> Smart Kiryana & Supplier Assistant
> SWE Assignment — Tajir Take-Home 2026
> Author: Hasnaat
> Deployed on: Vercel (static React) + Firebase (Firestore + Storage)

---

## Project Overview

Kiryana OS is a **cloud-backed, mobile-optimized web app** for Pakistani kiryana store owners and their helper boys. It manages the full credit loop: customer udhaar, supplier payables, inventory, and daily cash reconciliation with a real-time financial dashboard.

All data lives in **Firebase Firestore**. Item images live in **Firebase Storage**. The React frontend is deployed as a **static site on Vercel**. No Express server. No custom API. Firebase SDK talks directly to Google's infrastructure from the browser.

**Target Users:**
- **Owner:** Non-technical Android user. Thinks in "galla", "udhaar", "hisaab". Does NOT understand "revenue", "analytics", "sync".
- **Chota (Helper Boy):** Young, possibly limited literacy. Tap-only interface. Must NOT see financial summaries.

---

## Architecture

```
Vercel (Static Hosting)
└── React + Vite (SPA, no SSR)
    ├── Tailwind CSS (mobile-first, max-w-md on desktop)
    ├── Firebase SDK v10 (modular)
    │   ├── Firestore — all structured data
    │   └── Firebase Storage — item images only
    ├── Zustand — ephemeral UI state (cart, current mode)
    ├── TanStack Query (React Query) — async Firestore data fetching + caching
    └── Lucide React — icons
```

**There is no backend server. Do not create:**
- Any Express / Node / Python server
- Any API routes or serverless functions
- Any `.env` secrets that need a server to protect them (Firebase config is public-safe)

**The only "external" actions allowed:**
- Firebase SDK reads/writes (Firestore + Storage)
- `window.open('https://wa.me/...')` for WhatsApp reminders

---

## Firebase Setup

### Project Initialization

```bash
npm create vite@latest hisaab-kiryana -- --template react
cd hisaab-kiryana
npm install firebase zustand lucide-react @tanstack/react-query
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Environment Variables

Create `.env.local` at project root. Never commit this file (it's in `.gitignore` by default with Vite). On Vercel, add these as Environment Variables in the dashboard.

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> These are NOT secrets. Firebase API keys are safe to expose in frontend code —
> security is enforced by Firestore Security Rules, not by hiding the key.

### Firebase Config File

`src/firebase.js`

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const db      = getFirestore(app);
export const storage = getStorage(app);
```

### Firestore Security Rules

In Firebase Console → Firestore → Rules. Since there is no auth, allow open read/write for the demo. Flag this as a known security gap in the SWE requirements document.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Firebase Storage Rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

---

## Firestore Data Model

Firestore is a document/collection NoSQL database — NOT relational. Each collection holds documents. Documents have fields. No JOINs. Denormalize where needed.

### Collection: `customers`

```
customers/{customerId}
├── name:               string   (required)
├── phone:              string   (required, for WhatsApp — store without country code)
├── address:            string   (optional)
├── balance:            number   (current outstanding udhaar in Rs.)
├── total_given:        number   (lifetime udhaar extended)
├── total_recovered:    number   (lifetime udhaar collected)
├── last_payment_date:  string   (ISO date of last udhaar_recovered, null if never)
├── default_due_days:   number   (default: 10)
├── risk_score:         number   (0–100, stored after each recalculation)
├── risk_label:         string   ('safe' | 'watch' | 'risky' | 'blocked')
└── created_at:         Timestamp
```

### Collection: `suppliers`

```
suppliers/{supplierId}
├── name:               string
├── phone:              string   (optional)
├── payable_balance:    number   (credit stock not yet paid)
├── total_supplied:     number   (lifetime stock received value)
├── total_paid:         number   (lifetime payments made)
└── created_at:         Timestamp
```

### Collection: `items`

```
items/{itemId}
├── name:               string
├── price:              number   (selling price in Rs.)
├── description:        string   (optional)
├── category:           string   (free text — owner defines)
├── unit:               string   ('kg' | 'pcs' | 'ltr' | 'pkt')
├── stock_qty:          number
├── image_url:          string   (Firebase Storage download URL — NOT base64)
└── created_at:         Timestamp
```

### Collection: `transactions`

```
transactions/{transactionId}
├── type:               string
│   // 'cash_sale' | 'udhaar_given' | 'udhaar_recovered'
│   // 'supplier_cash_purchase' | 'supplier_credit_purchase'
│   // 'supplier_paid' | 'expense'
├── amount:             number
├── related_id:         string   (customerId or supplierId — empty for cash_sale/expense)
├── related_name:       string   (denormalized name for display — avoids extra reads)
├── date:               Timestamp
├── description:        string   (optional notes)
└── items_snapshot:     string   (JSON.stringify of cart array at time of sale)
```

> **Why denormalize `related_name`?**
> Firestore charges per document read. Storing the name on the transaction avoids
> fetching the customer/supplier document every time we render the ledger.

---

## Firestore Query Patterns

All Firestore calls live in `src/services/`. Never write raw Firestore queries inside components.

### `src/services/customers.js`

```javascript
import { db } from '../firebase';
import {
  collection, doc, addDoc, updateDoc, getDocs,
  query, where, orderBy, serverTimestamp
} from 'firebase/firestore';

const customersRef = collection(db, 'customers');

// Get all customers
export const getCustomers = () =>
  getDocs(query(customersRef, orderBy('name')));

// Get risky customers only
export const getRiskyCustomers = () =>
  getDocs(query(customersRef, where('balance', '>', 0), where('risk_label', 'in', ['risky', 'blocked'])));

// Add new customer
export const addCustomer = (data) =>
  addDoc(customersRef, { ...data, created_at: serverTimestamp() });

// Update customer (balance, risk score, etc.)
export const updateCustomer = (id, data) =>
  updateDoc(doc(db, 'customers', id), data);
```

### `src/services/transactions.js`

```javascript
import { db } from '../firebase';
import {
  collection, addDoc, getDocs,
  query, where, orderBy, serverTimestamp, Timestamp
} from 'firebase/firestore';

const txRef = collection(db, 'transactions');

// Get today's transactions
export const getTodayTransactions = () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return getDocs(query(
    txRef,
    where('date', '>=', Timestamp.fromDate(startOfDay)),
    orderBy('date', 'asc')
  ));
};

// Get all transactions for a specific customer
export const getCustomerTransactions = (customerId) =>
  getDocs(query(
    txRef,
    where('related_id', '==', customerId),
    orderBy('date', 'desc')
  ));

// Add transaction
export const addTransaction = (data) =>
  addDoc(txRef, { ...data, date: serverTimestamp() });
```

### `src/services/items.js`

```javascript
import { db, storage } from '../firebase';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from 'firebase/storage';

const itemsRef = collection(db, 'items');

export const getItems = () =>
  getDocs(query(itemsRef, orderBy('name')));

export const addItem = (data) =>
  addDoc(itemsRef, { ...data, created_at: serverTimestamp() });

export const updateItem = (id, data) =>
  updateDoc(doc(db, 'items', id), data);

export const deleteItem = (id) =>
  deleteDoc(doc(db, 'items', id));

// Upload image to Firebase Storage, return download URL
export const uploadItemImage = async (file, itemId) => {
  const storageRef = ref(storage, `items/${itemId}_${Date.now()}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// Delete image from Storage when item is deleted
export const deleteItemImage = (imageUrl) => {
  const storageRef = ref(storage, imageUrl);
  return deleteObject(storageRef).catch(() => {}); // silent fail if already gone
};
```

---

## Image Upload Flow (Items)

Images are stored in **Firebase Storage**, NOT as base64 in Firestore. The `image_url` field on an item document stores the public HTTPS download URL returned by `getDownloadURL()`.

**Add Item with Image — flow:**
1. Owner selects image via `<input type="file" accept="image/*">`
2. Validate: warn if file > 1MB (Firebase Storage limit is generous but large images slow mobile)
3. Show image preview immediately using `URL.createObjectURL(file)` (local only, pre-upload)
4. On form submit:
   a. `addDoc` the item first to get a Firestore document ID
   b. `uploadItemImage(file, newDocId)` → returns Storage download URL
   c. `updateItem(newDocId, { image_url: downloadUrl })` — patch the URL onto the document
5. If no image selected → `image_url: null` → UI renders a colored tile with item initial

**Edit Item Image — flow:**
1. If a new file is selected, upload new image, get new URL, update document
2. If there was a previous image URL, call `deleteItemImage(oldUrl)` to clean up Storage
3. If no new file selected, keep existing `image_url` unchanged

---

## React Query Integration

Use **TanStack Query** for all Firestore reads. This gives automatic caching, loading states, and refetch-on-focus without manual `useEffect` chains.

`src/hooks/useCustomers.js`

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomers, addCustomer, updateCustomer } from '../services/customers';

export const useCustomers = () =>
  useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const snap = await getCustomers();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  });

export const useAddCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addCustomer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] })
  });
};

export const useUpdateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateCustomer(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] })
  });
};
```

Create matching hooks for: `useItems`, `useSuppliers`, `useTodayTransactions`, `useAllTransactions`, `useCustomerTransactions(customerId)`.

**Query Key Conventions:**
```javascript
['customers']                    // all customers
['customers', 'risky']           // filtered
['items']                        // all items
['suppliers']                    // all suppliers
['transactions', 'today']        // today's transactions
['transactions', 'customer', id] // one customer's history
['transactions', 'all']          // all-time (dashboard)
```

---

## Seed Data

File: `src/seed.js`

Seed runs once on app mount. Check Firestore first:

```javascript
import { getDocs, collection } from 'firebase/firestore';
import { db } from './firebase';
import { addCustomer } from './services/customers';
// ... other imports

export const seedIfEmpty = async () => {
  const snap = await getDocs(collection(db, 'customers'));
  if (!snap.empty) return; // already seeded — do nothing

  // Seed customers, suppliers, items, transactions
  // (see seed content below)
};
```

**Customers to seed (5):**
- Raheem Bhai — Rs. 0, last payment today → SAFE
- Fatima Appa — Rs. 0, last payment 3 days ago → SAFE
- Ali Hassan — Rs. 3,200, last payment 18 days ago → RISKY
- Kamran Sb — Rs. 850, last payment 12 days ago → WATCH
- Bashir Chacha — Rs. 5,800, no payment ever, created 25 days ago → BLOCKED

**Suppliers to seed (3):**
- Karachi Wholesale — payable_balance Rs. 6,400
- Ahmed Rice Mill — payable_balance Rs. 0 (fully paid)
- City Cold Store — payable_balance Rs. 1,200 (new, recent delivery)

**Items to seed (14):**
Atta 5kg (Rs. 650, stock: 8), Chawal 1kg (Rs. 180, stock: 15), Daal Mash (Rs. 200, stock: 6), Daal Chana (Rs. 160, stock: 10), Cheeni 1kg (Rs. 120, stock: 12), Chai Patti (Rs. 95, stock: 20), Tel Sarson 1ltr (Rs. 380, stock: 5), Namak (Rs. 40, stock: 30), Lux Soap (Rs. 75, stock: 18), Sunsilk Sachet (Rs. 15, stock: 50), Mazedar Biscuit (Rs. 30, stock: 40), Matchbox (Rs. 10, stock: 60), Dahi 500g (Rs. 90, stock: 2), Pepsi 250ml (Rs. 50, stock: 8).

**Transactions to seed (8):**
Spread across today and last 3 days, covering: 3x `cash_sale`, 2x `udhaar_given` (to Ali Hassan and Kamran Sb), 1x `udhaar_recovered` (from Raheem Bhai), 1x `supplier_credit_purchase` (Karachi Wholesale), 1x `supplier_paid`.

> Seed transactions must use explicit Firestore `Timestamp.fromDate(new Date(...))` with
> realistic times — NOT `serverTimestamp()` — so historical data shows correctly.

---

## Vercel Deployment

### `vercel.json`

Create at project root. This tells Vercel to redirect all routes to `index.html` for client-side routing:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Deployment Steps

```bash
# 1. Build locally first to catch errors before deploying
npm run build

# 2. Install Vercel CLI
npm i -g vercel

# 3. Deploy (first time — follow prompts)
vercel

# 4. Add environment variables on Vercel dashboard:
# Settings → Environment Variables → add all VITE_FIREBASE_* vars
# Then redeploy:
vercel --prod
```

### `vite.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Split vendor chunks to keep main bundle lean for mobile
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/storage'],
          vendor:   ['react', 'react-dom', 'zustand', '@tanstack/react-query'],
        }
      }
    }
  }
});
```

> Manual chunk splitting is important — Firebase SDK is ~150KB. Splitting it prevents
> the main bundle from exceeding 300KB, which keeps load time under 3s on 4G.

---

## Mode Switching — No PIN

On first load, show a **full-screen Mode Selection Screen**. After selection, a persistent header shows current mode + "Badlo" button. No PIN. Trust-based.

```
┌─────────────────────────────┐
│                             │
│        KIRYANA OS           │
│                             │
│  ┌──────────────────────┐   │
│  │   👦   CHOTA MODE    │   │
│  │   Maal becho jaldi   │   │
│  └──────────────────────┘   │
│                             │
│  ┌──────────────────────┐   │
│  │   👨   OWNER MODE    │   │
│  │   Hisaab dekho       │   │
│  └──────────────────────┘   │
│                             │
└─────────────────────────────┘
```

**Zustand store (`src/store.js`):**
```javascript
// UI state only — all business data lives in Firestore via React Query
{
  currentMode: null | 'CHOTA' | 'OWNER',  // null = show mode selection screen
  cart: [{ itemId, name, price, qty }],   // ephemeral, cleared on checkout
}
```

---

## View 1: Chota Mode

**Two bottom tabs:** `[🛒 Becho]` `[📦 Items]`

### Tab 1: Becho (Sell)

```
┌─────────────────────────────┐
│  Kiryana OS  [CHOTA 👦]     │
│                  [Badlo]    │
├─────────────────────────────┤
│  Item Grid — 3 columns      │
│  Each tile:                 │
│   [Firebase Storage image   │
│    or colored initial tile] │
│   Name (1 line, truncated)  │
│   Rs. XXX                   │
│   Tap = add to cart         │
├─────────────────────────────┤
│  CART (collapsible drawer)  │
│  Daal Mash x2    Rs. 400    │
│  Cheeni x1       Rs. 120    │
│  [+ / –] per item           │
│  ─────────────────          │
│  TOTAL:        Rs. 520      │
├─────────────────────────────┤
│  [🟢 NAQAD LIYA]            │
│  [🔴 UDHAAR DIYA]           │
└─────────────────────────────┘
```

**NAQAD LIYA (Cash) — write operations:**
1. Confirm modal: "Rs. 520 naqad liya?"
2. `addTransaction({ type: 'cash_sale', amount, items_snapshot })`
3. Batch update: `updateItem(id, { stock_qty: currentQty - soldQty })` for each cart item
4. Invalidate `['items']` and `['transactions', 'today']` query keys
5. Clear cart in Zustand
6. Toast: "✅ Hisaab ho gaya! Rs. 520"

**UDHAAR DIYA (Credit) — write operations:**
1. Customer selector modal (from `useCustomers()`)
2. If `risk_label === 'blocked'` → warning overlay
3. `addTransaction({ type: 'udhaar_given', amount, related_id, related_name, items_snapshot })`
4. `updateCustomer(id, { balance: balance + amount, total_given: total_given + amount })`
5. Batch `updateItem` for stock
6. Run risk recalculation → `updateCustomer(id, { risk_score, risk_label })`
7. Invalidate `['customers']`, `['items']`, `['transactions', 'today']`
8. Toast: "🔴 Udhaar chadh gaya — [Name] Rs. 520"

> **Batching note:** Use Firestore `writeBatch` when updating multiple documents
> atomically (e.g., transaction + customer balance + stock). This prevents partial
> writes if the user closes the app mid-operation.

```javascript
import { writeBatch, doc } from 'firebase/firestore';

const batch = writeBatch(db);
batch.set(doc(collection(db, 'transactions')), txData);
batch.update(doc(db, 'customers', customerId), customerUpdates);
cartItems.forEach(item => {
  batch.update(doc(db, 'items', item.itemId), { stock_qty: item.newQty });
});
await batch.commit();
```

### Tab 2: Items (View Only)

Read-only. `useItems()` query. Items with `stock_qty <= 2` show ⚠️ Kam Stock. Images load from Firebase Storage URLs directly in `<img src={item.image_url}>`.

---

## View 2: Owner Mode

**Five bottom tabs:** `[📊 Hisaab]` `[🧾 Aaj]` `[👥 Udhaar]` `[🚛 Supplier]` `[📦 Inventory]`

---

### Owner Tab 1: Hisaab (All-Time Dashboard)

Reads from `useAllTransactions()` and `useCustomers()` and `useSuppliers()`.

```
┌─────────────────────────────┐
│  HISAAB KI KITAAB           │
├─────────────────────────────┤
│  NAQAD AAYA     Rs. 1,24,500│
│  UDHAAR BAAKI   Rs. 18,200  │
│  SUPPLIER DENA  Rs.  6,400  │
│  FAYDA (PROFIT) Rs. 43,100  │
├─────────────────────────────┤
│  RISKY CUSTOMERS: 3         │
│  [Udhaar tab mein dekho →]  │
├─────────────────────────────┤
│  LAST 7 DAYS — Cash Flow    │
│  [Plain SVG bar chart]      │
│  Green = naqad aaya         │
│  Red = udhaar diya          │
└─────────────────────────────┘
```

**Metric formulas** (`src/utils/finance.js`):
```javascript
// Input: all transactions array
const totalCashIn       = sum(tx where type in ['cash_sale', 'udhaar_recovered'])
const totalCashOut      = sum(tx where type in ['supplier_cash_purchase', 'supplier_paid', 'expense'])
const totalUdhaarPending = sum(customers.balance)          // from customers collection
const totalSupplierOwed  = sum(suppliers.payable_balance)  // from suppliers collection
const netProfit          = totalCashIn - totalCashOut
const cashInHand         = sum(cash_sale) + sum(udhaar_recovered) - sum(supplier_paid) - sum(expense)
```

**7-Day Chart:** Plain SVG, no chart library. Two bars per day (cash in green, udhaar red). Proportional heights. Day labels below (Mon, Tue…). Tap bar → brief tooltip.

---

### Owner Tab 2: Aaj (Today's Report)

Reads from `useTodayTransactions()`.

```
┌─────────────────────────────┐
│  AAJ KI REPORT — [Date]     │
├─────────────────────────────┤
│  NAQAD BIKRI    Rs. 3,450   │
│  UDHAAR DIYA    Rs.   800   │
│  UDHAAR AAYA    Rs.   500   │
│  SUPPLIER DIYA  Rs. 1,200   │
│  KHARCHA        Rs.     0   │
├─────────────────────────────┤
│  GALLA MEIN HONA CHAHIYE    │
│  Rs. 2,750    [calculated]  │
├─────────────────────────────┤
│  GALLA MEIN KITNA HAI?      │
│  [Rs. ___________]          │
├─────────────────────────────┤
│  FARAQ          (live)      │
│  Rs. 0  ✅ Theek hai        │
│  Rs. -200 🔴 Kam hai        │
│  Rs. +150 🟢 Zyada hai      │
├─────────────────────────────┤
│  AAJ KA LEDGER              │
│  11:02  Naqad   Rs. 450     │
│  11:45  Udhaar  Ali Rs.200  │
│  (tap row = detail sheet)   │
└─────────────────────────────┘
```

**Expected Cash:**
```javascript
todayExpected = sum(cash_sale today) + sum(udhaar_recovered today)
              - sum(supplier_paid today) - sum(expense today)
difference    = actualTyped - todayExpected  // live on keystroke
```

---

### Owner Tab 3: Udhaar

Reads `useCustomers()`. Filter chips: `[Sab] [Risky] [Safe]`.

Each customer row: Name | Balance | Days since last payment | Risk badge.

**Wasool Karo (Collect Payment) — write operations:**
```javascript
const batch = writeBatch(db);
batch.set(doc(collection(db, 'transactions')), {
  type: 'udhaar_recovered',
  amount: collectedAmount,
  related_id: customer.id,
  related_name: customer.name,
  date: serverTimestamp(),
});
batch.update(doc(db, 'customers', customer.id), {
  balance:           customer.balance - collectedAmount,
  total_recovered:   customer.total_recovered + collectedAmount,
  last_payment_date: new Date().toISOString(),
});
await batch.commit();
// Then recalculate risk and patch customer doc
```

**WhatsApp Reminder:**
```javascript
const sendReminder = (customer) => {
  const msg = encodeURIComponent(
    `Assalam-o-Alaikum ${customer.name} bhai! Aapka udhaar Rs. ${customer.balance} pending hai. Kirpya jald ada karein. Shukriya!`
  );
  window.open(`https://wa.me/92${customer.phone}?text=${msg}`, '_blank');
};
```

---

### Owner Tab 4: Supplier

Reads `useSuppliers()`.

**Maal Aaya — Naqad (Cash Purchase) writes:**
```javascript
batch.set(txDoc, { type: 'supplier_cash_purchase', amount, related_id, related_name, ... });
batch.update(supplierDoc, { total_supplied: supplier.total_supplied + amount });
// + updateItem stock_qty for each received item
await batch.commit();
```

**Maal Aaya — Udhaar (Credit Purchase) writes:**
```javascript
batch.set(txDoc, { type: 'supplier_credit_purchase', amount, related_id, related_name, ... });
batch.update(supplierDoc, {
  payable_balance: supplier.payable_balance + amount,
  total_supplied:  supplier.total_supplied + amount
});
// + updateItem stock_qty
await batch.commit();
```

**Payment Di writes:**
```javascript
batch.set(txDoc, { type: 'supplier_paid', amount, related_id, related_name, ... });
batch.update(supplierDoc, {
  payable_balance: supplier.payable_balance - amount,
  total_paid:      supplier.total_paid + amount
});
await batch.commit();
```

---

### Owner Tab 5: Inventory

Reads `useItems()`. Filter: `[Sab] [Kam Stock]`.

**Add Item with Image:**
```javascript
// 1. addDoc to get ID
const newRef = await addDoc(collection(db, 'items'), { ...formData, image_url: null });
// 2. Upload image to Storage
const url = await uploadItemImage(imageFile, newRef.id);
// 3. Patch image_url
await updateDoc(newRef, { image_url: url });
// 4. Invalidate ['items']
```

**Edit Item:** If new image selected → upload → update URL → delete old from Storage. Otherwise patch other fields only.

**Delete Item:** If no transactions reference this item → `deleteDoc`. If transactions exist → soft hide (`active: false` field). Always call `deleteItemImage(item.image_url)` on hard delete.

---

## Risk System

### Trigger Points
- After every `udhaar_given` write
- After every `udhaar_recovered` write
- On app mount — once per calendar day (store `last_risk_run` date in Firestore `meta/risk`)

### Score Formula (`src/utils/risk.js`)

```javascript
export function calculateRiskScore(customer, customerTransactions) {
  let score = 0;

  // 1. Days since last payment — max 40 pts
  const ref = customer.last_payment_date ?? customer.created_at;
  const daysSince = daysBetween(ref, new Date());
  if      (daysSince >= 30) score += 40;
  else if (daysSince >= 20) score += 30;
  else if (daysSince >= 10) score += 20;
  else if (daysSince >= 5)  score += 10;

  // 2. Recovery rate — max 30 pts
  const rate = customer.total_given > 0
    ? customer.total_recovered / customer.total_given : 1;
  if      (rate < 0.25) score += 30;
  else if (rate < 0.50) score += 20;
  else if (rate < 0.75) score += 10;

  // 3. Balance size — max 20 pts
  if      (customer.balance >= 5000) score += 20;
  else if (customer.balance >= 2000) score += 15;
  else if (customer.balance >= 1000) score += 10;
  else if (customer.balance >= 500)  score += 5;

  // 4. Consecutive udhaar streak without payment — max 10 pts
  const streak = countUdhaarStreakWithoutPayment(customerTransactions);
  if      (streak >= 5) score += 10;
  else if (streak >= 3) score += 5;

  return Math.min(score, 100);
}

export function getRiskLabel(score, customer) {
  // 10-day baseline rule: never below WATCH if overdue
  const ref = customer.last_payment_date ?? customer.created_at;
  const daysSince = daysBetween(ref, new Date());
  if (customer.balance > 0 && daysSince >= 10 && score < 21) return 'watch';

  if (score <= 20)  return 'safe';
  if (score <= 45)  return 'watch';
  if (score <= 70)  return 'risky';
  return 'blocked';
}
```

| Score | Label | Color | Action |
|-------|-------|-------|--------|
| 0–20 | SAFE | Green | No action needed |
| 21–45 | WATCH | Amber | Keep an eye |
| 46–70 | RISKY | Orange | Send WhatsApp reminder |
| 71–100 | BLOCKED | Dark Red | Warn Chota on udhaar attempt |

---

## UI/UX Rules — Non-Negotiable

### Aesthetic: Physical Ledger Book
Feels like a paper hisaab register — NOT a SaaS product. No gradients. No glassmorphism. No blur. No floating shadows.

- Background: off-white `#fafaf9` like aged paper
- Text: near-black ink `#1c1917`
- Dividers: thin 1px ruled lines
- Cards: plain rectangles with `border border-stone-300` — no `shadow-*`

### Color System

```css
--color-cash:    #15803d;  /* green-700  — cash, safe, positive */
--color-udhaar:  #b91c1c;  /* red-700    — debt, danger */
--color-watch:   #b45309;  /* amber-700  — warning */
--color-blocked: #7c2d12;  /* orange-900 — blocked */
--color-text:    #1c1917;  /* stone-900  — primary text */
--color-bg:      #fafaf9;  /* stone-50   — page background */
--color-surface: #f5f5f4;  /* stone-100  — section bg */
--color-border:  #d6d3d1;  /* stone-300  — ruled lines */
--color-muted:   #78716c;  /* stone-500  — secondary labels */
```

### Typography
- Numbers: **IBM Plex Mono** (Google Fonts) — monospace, bold. Cash register feel.
- Body: **Noto Sans** (Google Fonts) — NOT Inter, NOT Roboto, NOT system-ui
- Large numbers: `text-3xl font-black font-mono`
- Section labels: `text-xs uppercase tracking-widest text-stone-500`

Load from Google Fonts in `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@700&family=Noto+Sans:wght@400;600;800&display=swap" rel="stylesheet">
```

### Touch Targets
- Minimum height: `h-14` (56px)
- Primary actions (NAQAD / UDHAAR): `h-16` (64px)
- Font on buttons: `text-lg`
- Minimum 12px gap between tappable elements

### Language Rules
```
App navigation & labels  →  English
Transactional text        →  Roman Urdu
Confirmations/errors      →  Roman Urdu
Numbers                   →  English numerals only (1234, NOT ١٢٣٤)
Currency                  →  "Rs." prefix always (NEVER PKR, NEVER ₨)
```

Examples:
- ✅ `Aaj ki Sale: Rs. 3,450`
- ✅ `Udhaar chadh gaya! Rs. 800`
- ✅ `Galla mein kitna cash hai?`
- ❌ `Today's Revenue: PKR 3,450.00`
- ❌ `Payment received successfully.`

### Loading States
- Use React Query's `isLoading` / `isFetching` states
- Show skeleton loaders (plain grey rects matching expected content height)
- Never show empty content while loading — Firestore queries on slow connections take 1–2s

### Toast Notifications
- Slides up from bottom, visible 2.5s
- Green for success, red for error
- Under 8 words: "Udhaar chadh gaya! Rs. 800" ✅

---

## File Structure

```
hisaab-kiryana/
├── public/
├── src/
│   ├── firebase.js                # Firebase app + db + storage exports
│   ├── store.js                   # Zustand: currentMode, cart
│   ├── seed.js                    # Runs once if Firestore is empty
│   ├── services/
│   │   ├── customers.js           # Firestore CRUD for customers
│   │   ├── suppliers.js           # Firestore CRUD for suppliers
│   │   ├── items.js               # Firestore CRUD + Storage upload for items
│   │   └── transactions.js        # Firestore CRUD for transactions
│   ├── hooks/
│   │   ├── useCustomers.js        # React Query hooks for customers
│   │   ├── useSuppliers.js
│   │   ├── useItems.js
│   │   └── useTransactions.js
│   ├── utils/
│   │   ├── risk.js                # calculateRiskScore(), getRiskLabel()
│   │   ├── finance.js             # Dashboard metric calculations
│   │   └── format.js              # formatRs(), formatDate(), formatDaysAgo()
│   ├── App.jsx                    # Root: QueryClientProvider + mode routing
│   ├── components/
│   │   ├── ModeSelector.jsx
│   │   ├── ChotaMode/
│   │   │   ├── index.jsx
│   │   │   ├── ItemGrid.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── CheckoutBar.jsx
│   │   │   └── ItemsViewOnly.jsx
│   │   ├── OwnerMode/
│   │   │   ├── index.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── TodayReport.jsx
│   │   │   ├── UdhaarList.jsx
│   │   │   ├── SupplierList.jsx
│   │   │   └── Inventory.jsx
│   │   └── shared/
│   │       ├── ModeBar.jsx
│   │       ├── Modal.jsx
│   │       ├── Toast.jsx
│   │       ├── RiskBadge.jsx
│   │       ├── Skeleton.jsx
│   │       ├── CustomerSelectModal.jsx
│   │       └── ConfirmModal.jsx
│   └── main.jsx
├── .env.local                     # Firebase config (gitignored)
├── .gitignore                     # Must include .env.local
├── vercel.json                    # SPA rewrite rules
├── CLAUDE.md
├── index.html
├── tailwind.config.js
└── vite.config.js
```

---

## Transaction Logic Reference

| Action | Transaction Type | Firestore Batch Updates |
|--------|-----------------|------------------------|
| Chota: cash sale | `cash_sale` | `items.stock_qty` ↓ per item |
| Chota: udhaar | `udhaar_given` | `customer.balance` ↑, `total_given` ↑, `stock_qty` ↓, risk recalc |
| Owner: collect udhaar | `udhaar_recovered` | `customer.balance` ↓, `total_recovered` ↑, `last_payment_date` = now, risk recalc |
| Owner: stock (cash) | `supplier_cash_purchase` | `item.stock_qty` ↑, `supplier.total_supplied` ↑ |
| Owner: stock (credit) | `supplier_credit_purchase` | `item.stock_qty` ↑, `supplier.payable_balance` ↑, `total_supplied` ↑ |
| Owner: pay supplier | `supplier_paid` | `supplier.payable_balance` ↓, `total_paid` ↑ |
| Owner: expense | `expense` | transaction record only |

> All multi-document operations MUST use `writeBatch`. Never fire multiple independent
> `updateDoc` calls for a single logical operation — partial writes cause data corruption.

---

## Known Constraints (SWE Assignment)

| # | Constraint | Details |
|---|-----------|---------|
| 1 | Open Firestore rules | No auth = public read/write. Flagged as security gap. Production needs Firebase Auth. |
| 2 | Trust-based mode switch | No cryptographic separation between Owner and Chota. Anyone with URL accesses all data. |
| 3 | Single-store only | No multi-branch, no user accounts. Out of scope. |
| 4 | WhatsApp no delivery confirm | URL-based, no read receipts. |
| 5 | Risk score is heuristic | Deterministic rule engine, not ML. Intentional for auditability. |
| 6 | Firebase free tier limits | 50k reads/day, 20k writes/day, 1GB storage. Sufficient for demo; not for 100+ active stores. |

---

## Functional Requirements

- **FR-01:** System shall display a mode selection screen on launch
- **FR-02:** System shall allow switching between Chota and Owner mode at any time
- **FR-03:** System shall allow Chota to log cash sales via item grid with Firebase batch writes
- **FR-04:** System shall allow Chota to log udhaar sales against a named customer
- **FR-05:** System shall decrement item stock quantity atomically on every sale
- **FR-06:** System shall maintain a running balance per customer in Firestore
- **FR-07:** System shall allow Owner to add/edit/delete inventory items with Firebase Storage images
- **FR-08:** System shall allow Owner to add and manage suppliers
- **FR-09:** System shall allow Owner to record supplier deliveries (cash or credit) and update stock
- **FR-10:** System shall allow Owner to record supplier payments and update payable balance
- **FR-11:** System shall compute and store risk score (0–100) and label per customer
- **FR-12:** System shall auto-escalate any customer unpaid > 10 days to minimum WATCH
- **FR-13:** System shall warn Chota when giving udhaar to a BLOCKED customer
- **FR-14:** System shall display all-time dashboard: cash in, udhaar pending, supplier payable, profit
- **FR-15:** System shall display today's report with all transaction categories
- **FR-16:** System shall compare actual vs. expected drawer cash in real time
- **FR-17:** System shall allow partial or full udhaar payment collection
- **FR-18:** System shall generate pre-filled WhatsApp reminders for overdue customers
- **FR-19:** System shall seed Firestore with demo data on first load if database is empty
- **FR-20:** Item images shall be stored in Firebase Storage and loaded via HTTPS URL

## Non-Functional Requirements

- **NFR-01:** App shall be deployed at a public Vercel URL with no authentication
- **NFR-02:** All touch targets shall be minimum 48px height
- **NFR-03:** App shall load within 3 seconds on mid-range Android on 4G (requires chunk splitting)
- **NFR-04:** All transactional text shall be in Roman Urdu
- **NFR-05:** All multi-document writes shall use Firestore `writeBatch` for atomicity
- **NFR-06:** App shall run in mobile browser without installation
- **NFR-07:** Firebase config keys shall be stored in `.env.local` and Vercel environment variables

## Constraints

- **CON-01:** No custom backend server
- **CON-02:** No authentication system
- **CON-03:** Zero budget — Firebase Spark (free) tier only
- **CON-04:** Static site deployment on Vercel only

---

## Out of Scope

- Firebase Auth or any user accounts
- Cloud Functions / serverless backend
- SMS integration
- Receipt printing / PDF export
- Multi-store / multi-branch
- Expiry date or batch tracking
- ML-based risk prediction
- Real-time Firestore `onSnapshot` listeners (polling via React Query refetch is sufficient for MVP)

---

## Build Order

```
1. src/firebase.js                    → connect to Firestore + Storage
2. src/services/*.js                  → all raw Firestore operations
3. src/seed.js                        → run + verify data in Firebase Console
4. src/utils/risk.js + finance.js     → pure functions, no Firebase dependency
5. src/hooks/*.js                     → React Query wrappers
6. src/store.js + ModeSelector.jsx    → mode switching works
7. ChotaMode (ItemGrid → Cart → Checkout)
8. OwnerMode/TodayReport.jsx          → most critical owner screen
9. OwnerMode/UdhaarList.jsx
10. OwnerMode/Inventory.jsx           → image upload flow
11. OwnerMode/SupplierList.jsx
12. OwnerMode/Dashboard.jsx           → built last, depends on all transaction data
13. vercel.json + npm run build       → verify build succeeds locally
14. vercel --prod                     → deploy, add env vars in Vercel dashboard
```