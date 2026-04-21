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
  ], { allKeys: true });

  // 2. Realistic Suppliers
  await db.suppliers.bulkAdd([
    { name: "Ahmed Wholesalers (General)", payable_balance: 45000 },
    { name: "Unilever Distributor", payable_balance: 12500 },
    { name: "Engro Foods (Dairy)", payable_balance: 0 },
    { name: "P&G Agency", payable_balance: 32000 },
    { name: "Local Roti Wala", payable_balance: 1500 },
  ]);

  // 3. Realistic Inventory (Brands & Pakistani/Indian Market Context) with Compressed CDN Images
  await db.items.bulkAdd([
    { name: "Tapal Danedar 200g", price: 540, emoji: "🍵", category: "grocery", description: "Premium Black Tea", image_url: "https://loremflickr.com/320/320/tea,leaves?lock=1" },
    { name: "Lipton Yellow Label 190g", price: 520, emoji: "🍵", category: "grocery", description: "Black Tea", image_url: "https://loremflickr.com/320/320/tea,bag?lock=2" },
    { name: "Nestle MilkPak 1L", price: 300, emoji: "🥛", category: "dairy", description: "UHT Milk", image_url: "https://loremflickr.com/320/320/milk,milkcarton?lock=3" },
    { name: "Olpers Milk 1L", price: 310, emoji: "🥛", category: "dairy", description: "UHT Milk", image_url: "https://loremflickr.com/320/320/milk,bottle?lock=4" },
    { name: "Sunridge Chakki Atta 5kg", price: 1450, emoji: "🌾", category: "grocery", description: "Whole Wheat", image_url: "https://loremflickr.com/320/320/flour,bag?lock=5" },
    { name: "Daal Masoor 1kg", price: 320, emoji: "🥣", category: "grocery", description: "Loose Daal", image_url: "https://loremflickr.com/320/320/lentils?lock=6" },
    { name: "Daal Chana 1kg", price: 280, emoji: "🥣", category: "grocery", description: "Loose Daal", image_url: "https://loremflickr.com/320/320/yellow,lentil?lock=7" },
    { name: "Basmati Rice 1kg", price: 450, emoji: "🍚", category: "grocery", description: "Super Kernal", image_url: "https://loremflickr.com/320/320/rice,grain?lock=8" },
    { name: "Dalda Cooking Oil 1L", price: 620, emoji: "🛢️", category: "grocery", description: "Pouch", image_url: "https://loremflickr.com/320/320/cooking,oil?lock=9" },
    { name: "Mezan Canola Oil 1L", price: 600, emoji: "🛢️", category: "grocery", description: "Pouch", image_url: "https://loremflickr.com/320/320/oil,bottle?lock=10" },
    { name: "National Ketchup 800g", price: 420, emoji: "🍅", category: "grocery", description: "Tomato Ketchup", image_url: "https://loremflickr.com/320/320/ketchup?lock=11" },
    { name: "Shangrila Chilli Garlic 800g", price: 450, emoji: "🌶️", category: "grocery", description: "Chilli Sauce", image_url: "https://loremflickr.com/320/320/chili,sauce?lock=12" },
    { name: "Lifebuoy Soap 100g", price: 110, emoji: "🧼", category: "personal", description: "Red Bar", image_url: "https://loremflickr.com/320/320/red,soap?lock=13" },
    { name: "Safeguard Soap 130g", price: 160, emoji: "🧼", category: "personal", description: "White Bar", image_url: "https://loremflickr.com/320/320/white,soap?lock=14" },
    { name: "Surf Excel 1kg", price: 650, emoji: "👕", category: "household", description: "Washing Powder", image_url: "https://loremflickr.com/320/320/washing,powder?lock=15" },
    { name: "Ariel 500g", price: 340, emoji: "👕", category: "household", description: "Washing Powder", image_url: "https://loremflickr.com/320/320/detergent?lock=16" },
    { name: "Sunsilk Shampoo 180ml", price: 350, emoji: "🧴", category: "personal", description: "Black shine", image_url: "https://loremflickr.com/320/320/shampoo,bottle?lock=17" },
    { name: "Colgate MaxFresh 120g", price: 250, emoji: "🦷", category: "personal", description: "Red gel", image_url: "https://loremflickr.com/320/320/toothpaste?lock=18" },
    { name: "Lays French Cheese (Large)", price: 100, emoji: "🥔", category: "snack", description: "Chips", image_url: "https://loremflickr.com/320/320/potato,chips?lock=19" },
    { name: "Kurkure Chutney Chaska", price: 50, emoji: "🌶️", category: "snack", description: "Snack", image_url: "https://loremflickr.com/320/320/corn,snack?lock=20" },
    { name: "Superbiscuit / Sooper", price: 40, emoji: "🍪", category: "snack", description: "Peak Freans", image_url: "https://loremflickr.com/320/320/biscuits?lock=21" },
    { name: "Rio Biscuit", price: 30, emoji: "🍪", category: "snack", description: "Chocolate vanilla", image_url: "https://loremflickr.com/320/320/chocolate,biscuit?lock=22" },
    { name: "Coca Cola 1.5L", price: 180, emoji: "🥤", category: "beverage", description: "Cold Drink", image_url: "https://loremflickr.com/320/320/cola,bottle?lock=23" },
    { name: "Sprite 1.5L", price: 180, emoji: "🥤", category: "beverage", description: "Cold Drink", image_url: "https://loremflickr.com/320/320/sprite,bottle?lock=24" },
    { name: "Fresh Dahi", price: 200, emoji: "🥣", category: "dairy", description: "Per kg", image_url: "https://loremflickr.com/320/320/yogurt,bowl?lock=25" },
    { name: "Anda (Egg)", price: 30, emoji: "🥚", category: "dairy", description: "Per piece", image_url: "https://loremflickr.com/320/320/egg?lock=26" },
    { name: "National Salt 800g", price: 60, emoji: "🧂", category: "grocery", description: "Iodized Salt", image_url: "https://loremflickr.com/320/320/salt,shaker?lock=27" },
    { name: "Mortein Coil", price: 120, emoji: "🦟", category: "household", description: "Mosquito repellent", image_url: "https://loremflickr.com/320/320/mosquito,coil?lock=28" },
    { name: "Matchbox Bundle", price: 50, emoji: "🔥", category: "household", description: "10 boxes", image_url: "https://loremflickr.com/320/320/matches?lock=29" },
  ]);

  // 4. Realistic Historical Transactions
  await db.transactions.bulkAdd([
    // Historic Udhaar balances
    { type: "udhaar_given", amount: 5400, related_id: custIds[0], date: daysAgoISO(12), description: "Month start grocery" },
    { type: "udhaar_given", amount: 1200, related_id: custIds[1], date: daysAgoISO(5), description: "Surf and Soap" },
    { type: "udhaar_given", amount: 14500, related_id: custIds[2], date: daysAgoISO(25), description: "Wholesale tea/sugar for stall" },
    { type: "udhaar_given", amount: 3200, related_id: custIds[3], date: daysAgoISO(8), description: "Cigarettes & snacks" },
    { type: "udhaar_given", amount: 6500, related_id: custIds[5], date: daysAgoISO(20), description: "Hostel groceries" },
    // A historic repayment (Wasool)
    { type: "udhaar_recovered", amount: 2000, related_id: custIds[5], date: daysAgoISO(2), description: "Partial payment" },
    
    // Historic Supplier Payables/Payments
    { type: "supplier_credit_received", amount: 45000, related_id: 1, date: daysAgoISO(4), description: "Monthly bulk refill: Sugar, rice, oil" },
    { type: "supplier_credit_received", amount: 12500, related_id: 2, date: daysAgoISO(10), description: "Shampoos and Soaps batch" },
    { type: "supplier_credit_received", amount: 32000, related_id: 4, date: daysAgoISO(6), description: "Detergents stock" },
    { type: "supplier_paid", amount: 10000, related_id: 1, date: daysAgoISO(1), description: "Cash given to rider" },

    // Today's specific transactions
    { type: "cash_sale", amount: 300, date: todayISO(), description: "1× MilkPak 1L" },
    { type: "cash_sale", amount: 500, date: todayISO(), description: "2× Coca Cola 1.5L, 1× Lays" },
    { type: "cash_sale", amount: 1450, date: todayISO(), description: "1× Sunridge Atta 5kg" },
    { type: "cash_sale", amount: 60, date: todayISO(), description: "2× Anda" },
    { type: "udhaar_given", amount: 800, related_id: custIds[4], date: todayISO(), description: "1× Dalda Oil, 2× Eggs" },
    { type: "udhaar_recovered", amount: 1500, related_id: custIds[0], date: todayISO(), description: "Ali bhai cash given" },
  ]);
}
