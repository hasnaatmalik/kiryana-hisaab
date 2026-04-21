import { db, todayISO } from "./db";

export async function seedIfEmpty() {
  const count = await db.customers.count();
  if (count > 0) return;

  const now = Date.now();
  const dayMs = 1000 * 60 * 60 * 24;
  const daysAgoISO = (n: number) => new Date(now - n * dayMs).toISOString();

  // 1. Realistic Customers
  const custIds = await db.customers.bulkAdd([
    { name: "Ali Qureshi bhai", phone: "03001234567", balance: 5400, default_due_days: 15, risk_status: "good" },
    { name: "Bilal (Dhobi)", phone: "03217654321", balance: 1200, default_due_days: 10, risk_status: "good" },
    { name: "Imran Chacha (Tea Stall)", phone: "03331112222", balance: 14500, default_due_days: 30, risk_status: "risky" },
    { name: "Akram Mechanic", phone: "03458889999", balance: 3200, default_due_days: 15, risk_status: "good" },
    { name: "Haider Flat 402", phone: "03112223333", balance: 800, default_due_days: 7, risk_status: "good" },
    { name: "Zain student", phone: "03019876543", balance: 6500, default_due_days: 10, risk_status: "risky" },
    { name: "Tariq Butcher", phone: "03211610272", balance: 9800, default_due_days: 7, risk_status: "risky" },
    { name: "Naseem Darzi", phone: "03146844820", balance: 7200, default_due_days: 10, risk_status: "risky" },
  ], { allKeys: true });

  // 2. Realistic Suppliers
  await db.suppliers.bulkAdd([
    { name: "Ahmed Wholesalers (General)", payable_balance: 45000 },
    { name: "Unilever Distributor", payable_balance: 12500 },
    { name: "Engro Foods (Dairy)", payable_balance: 0 },
    { name: "P&G Agency", payable_balance: 32000 },
    { name: "Local Roti Wala", payable_balance: 1500 },
  ]);

  // 3. Inventory (Basmati Rice, Dalda, Mezan Canola Oil, Fresh Dahi removed)
  await db.items.bulkAdd([
    { name: "Tapal Danedar 200g", price: 540, emoji: "🍵", category: "grocery", description: "Premium Black Tea", image_url: "/items/tapal-danedar.jpg" },
    { name: "Lipton Yellow Label 190g", price: 520, emoji: "🍵", category: "grocery", description: "Black Tea", image_url: "/items/lipton.jpg" },
    { name: "Nestle MilkPak 1L", price: 300, emoji: "🥛", category: "dairy", description: "UHT Milk", image_url: "/items/milkpak.jpg" },
    { name: "Olpers Milk 1L", price: 310, emoji: "🥛", category: "dairy", description: "UHT Milk", image_url: "/items/olpers.webp" },
    { name: "Sunridge Chakki Atta 5kg", price: 1450, emoji: "🌾", category: "grocery", description: "Whole Wheat", image_url: "/items/sunridge.webp" },
    { name: "Daal Masoor 1kg", price: 320, emoji: "🥣", category: "grocery", description: "Loose Daal", image_url: "/items/daal-masoor.jpg" },
    { name: "Daal Chana 1kg", price: 280, emoji: "🥣", category: "grocery", description: "Loose Daal", image_url: "/items/daal-channa.jpg" },
    { name: "National Ketchup 800g", price: 420, emoji: "🍅", category: "grocery", description: "Tomato Ketchup", image_url: "/items/ketchup-national.jpg" },
    { name: "Shangrila Chilli Garlic 800g", price: 450, emoji: "🌶️", category: "grocery", description: "Chilli Sauce", image_url: "/items/chili-garlic.jpg" },
    { name: "Lifebuoy Soap 100g", price: 110, emoji: "🧼", category: "personal", description: "Red Bar", image_url: "/items/lifebuoy.webp" },
    { name: "Safeguard Soap 130g", price: 160, emoji: "🧼", category: "personal", description: "White Bar", image_url: "/items/safeguard.jpg" },
    { name: "Surf Excel 1kg", price: 650, emoji: "👕", category: "household", description: "Washing Powder", image_url: "/items/surfexcel.jpg" },
    { name: "Ariel 500g", price: 340, emoji: "👕", category: "household", description: "Washing Powder", image_url: "/items/ariel.jpg" },
    { name: "Sunsilk Shampoo 180ml", price: 350, emoji: "🧴", category: "personal", description: "Black shine", image_url: "/items/sunsilk.jpg" },
    { name: "Colgate MaxFresh 120g", price: 250, emoji: "🦷", category: "personal", description: "Red gel", image_url: "/items/colgate.png" },
    { name: "Lays French Cheese (Large)", price: 100, emoji: "🥔", category: "snack", description: "Chips", image_url: "/items/lays.webp" },
    { name: "Kurkure Chutney Chaska", price: 50, emoji: "🌶️", category: "snack", description: "Snack", image_url: "/items/kurkure.webp" },
    { name: "Superbiscuit / Sooper", price: 40, emoji: "🍪", category: "snack", description: "Peak Freans", image_url: "/items/sooper.png" },
    { name: "Rio Biscuit", price: 30, emoji: "🍪", category: "snack", description: "Chocolate vanilla", image_url: "/items/rio.jpg" },
    { name: "Coca Cola 1.5L", price: 180, emoji: "🥤", category: "beverage", description: "Cold Drink", image_url: "/items/cocacola.jpg" },
    { name: "Sprite 1.5L", price: 180, emoji: "🥤", category: "beverage", description: "Cold Drink", image_url: "/items/sprite.jpg" },
    { name: "Anda (Egg)", price: 30, emoji: "🥚", category: "dairy", description: "Per piece", image_url: "/items/egg.jpg" },
    { name: "National Salt 800g", price: 60, emoji: "🧂", category: "grocery", description: "Iodized Salt", image_url: "/items/salt.jpg" },
    { name: "Mortein Coil", price: 120, emoji: "🦟", category: "household", description: "Mosquito repellent", image_url: "/items/mortein.jpg" },
    { name: "Matchbox Bundle", price: 50, emoji: "🔥", category: "household", description: "10 boxes", image_url: "/items/matchbox.jpg" },
  ]);

  // 4. Historical Transactions — healthy, profitable business
  await db.transactions.bulkAdd([
    // Historic Udhaar balances
    { type: "udhaar_given", amount: 5400, related_id: custIds[0], date: daysAgoISO(12), description: "Month start grocery" },
    { type: "udhaar_given", amount: 1200, related_id: custIds[1], date: daysAgoISO(5), description: "Surf and Soap" },
    { type: "udhaar_given", amount: 14500, related_id: custIds[2], date: daysAgoISO(25), description: "Wholesale tea/sugar for stall" },
    { type: "udhaar_given", amount: 3200, related_id: custIds[3], date: daysAgoISO(8), description: "Cigarettes & snacks" },
    { type: "udhaar_given", amount: 6500, related_id: custIds[5], date: daysAgoISO(20), description: "Hostel groceries" },
    { type: "udhaar_given", amount: 9800, related_id: custIds[6], date: daysAgoISO(14), description: "Meat & grocery udhaar" },
    { type: "udhaar_given", amount: 7200, related_id: custIds[7], date: daysAgoISO(18), description: "Monthly ration" },
    // Repayments (Wasool)
    { type: "udhaar_recovered", amount: 2000, related_id: custIds[5], date: daysAgoISO(2), description: "Partial payment" },
    { type: "udhaar_recovered", amount: 4500, related_id: custIds[0], date: daysAgoISO(7), description: "Ali bhai partial clear" },
    { type: "udhaar_recovered", amount: 3000, related_id: custIds[3], date: daysAgoISO(3), description: "Mechanic ne diye" },

    // Supplier Payables/Payments
    { type: "supplier_credit_received", amount: 45000, related_id: 1, date: daysAgoISO(4), description: "Monthly bulk refill: Atta, daal, snacks" },
    { type: "supplier_credit_received", amount: 12500, related_id: 2, date: daysAgoISO(10), description: "Shampoos and Soaps batch" },
    { type: "supplier_credit_received", amount: 32000, related_id: 4, date: daysAgoISO(6), description: "Detergents stock" },
    { type: "supplier_paid", amount: 25000, related_id: 1, date: daysAgoISO(3), description: "Cash cleared to Ahmed Wholesalers" },
    { type: "supplier_paid", amount: 12500, related_id: 2, date: daysAgoISO(2), description: "Unilever distributor fully cleared" },
    { type: "supplier_paid", amount: 20000, related_id: 4, date: daysAgoISO(1), description: "Partial payment to P&G" },

    // Strong historic cash sales (past 30 days)
    { type: "cash_sale", amount: 8500, date: daysAgoISO(30), description: "Bulk sales — month start rush" },
    { type: "cash_sale", amount: 6200, date: daysAgoISO(28), description: "Weekend sales" },
    { type: "cash_sale", amount: 4800, date: daysAgoISO(25), description: "Daily grocery mix" },
    { type: "cash_sale", amount: 7100, date: daysAgoISO(22), description: "Snacks, beverages, soaps" },
    { type: "cash_sale", amount: 5400, date: daysAgoISO(20), description: "Atta, daal, milk sales" },
    { type: "cash_sale", amount: 9200, date: daysAgoISO(18), description: "Weekly bulk — Surf, Ariel, Colgate" },
    { type: "cash_sale", amount: 6700, date: daysAgoISO(15), description: "Mixed grocery" },
    { type: "cash_sale", amount: 5900, date: daysAgoISO(12), description: "Beverages & snacks rush" },
    { type: "cash_sale", amount: 7800, date: daysAgoISO(10), description: "Daily run — tea, eggs, biscuits" },
    { type: "cash_sale", amount: 4300, date: daysAgoISO(8), description: "Personal care items" },
    { type: "cash_sale", amount: 6100, date: daysAgoISO(6), description: "Household items batch" },
    { type: "cash_sale", amount: 8400, date: daysAgoISO(4), description: "Weekend peak sales" },
    { type: "cash_sale", amount: 5600, date: daysAgoISO(3), description: "Mixed routine sales" },
    { type: "cash_sale", amount: 3900, date: daysAgoISO(2), description: "Evening sales" },
    { type: "cash_sale", amount: 7200, date: daysAgoISO(1), description: "Yesterday — strong day" },

    // Today's transactions
    { type: "cash_sale", amount: 300, date: todayISO(), description: "1× MilkPak 1L" },
    { type: "cash_sale", amount: 500, date: todayISO(), description: "2× Coca Cola 1.5L, 1× Lays" },
    { type: "cash_sale", amount: 1450, date: todayISO(), description: "1× Sunridge Atta 5kg" },
    { type: "cash_sale", amount: 120, date: todayISO(), description: "4× Anda" },
    { type: "cash_sale", amount: 650, date: todayISO(), description: "1× Surf Excel 1kg" },
    { type: "udhaar_given", amount: 800, related_id: custIds[4], date: todayISO(), description: "Daal + eggs udhaar" },
    { type: "udhaar_recovered", amount: 1500, related_id: custIds[0], date: todayISO(), description: "Ali bhai cash given" },
  ]);
}
