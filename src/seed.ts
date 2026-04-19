import { db, todayISO } from "./db";

export async function seedIfEmpty() {
  const count = await db.customers.count();
  if (count > 0) return;

  const now = Date.now();
  const dayMs = 1000 * 60 * 60 * 24;
  const daysAgoISO = (n: number) => new Date(now - n * dayMs).toISOString();

  const cust1 = await db.customers.add({
    name: "Ali Bhai", phone: "3001234567", balance: 0,
    default_due_days: 14, risk_status: "good",
  });
  const cust2 = await db.customers.add({
    name: "Bilal Sahab", phone: "3217654321", balance: 0,
    default_due_days: 14, risk_status: "good",
  });
  const cust3 = await db.customers.add({
    name: "Imran Chacha", phone: "3331112222", balance: 4500,
    default_due_days: 14, risk_status: "risky",
  });
  const cust4 = await db.customers.add({
    name: "Akram Bhai", phone: "3458889999", balance: 7800,
    default_due_days: 14, risk_status: "risky",
  });

  await db.suppliers.bulkAdd([
    { name: "Ahmed Wholesalers", payable_balance: 12000 },
    { name: "Karachi Traders", payable_balance: 0 },
    { name: "Lahore Distributors", payable_balance: 0 },
  ]);

  await db.items.bulkAdd([
    { name: "Sugar", price: 280, emoji: "🍬", category: "grocery" },
    { name: "Daal", price: 320, emoji: "🥣", category: "grocery" },
    { name: "Chawal", price: 450, emoji: "🍚", category: "grocery" },
    { name: "Soap", price: 120, emoji: "🧼", category: "personal" },
    { name: "Chai", price: 540, emoji: "🍵", category: "grocery" },
    { name: "Tel", price: 620, emoji: "🛢️", category: "grocery" },
    { name: "Atta", price: 1450, emoji: "🌾", category: "grocery" },
    { name: "Dahi", price: 180, emoji: "🥛", category: "dairy" },
    { name: "Namak", price: 60, emoji: "🧂", category: "grocery" },
    { name: "Mazedar Biscuit", price: 50, emoji: "🍪", category: "snack" },
    { name: "Matchbox", price: 20, emoji: "🔥", category: "household" },
    { name: "Shampoo", price: 240, emoji: "🧴", category: "personal" },
  ]);

  // Backdate the overdue customers' udhaar
  await db.transactions.bulkAdd([
    {
      type: "udhaar_given", amount: 4500, related_id: cust3,
      date: daysAgoISO(20), description: "Old udhaar — Imran Chacha",
    },
    {
      type: "udhaar_given", amount: 7800, related_id: cust4,
      date: daysAgoISO(28), description: "Old udhaar — Akram Bhai",
    },
    // Today's mix
    { type: "cash_sale", amount: 540, related_id: undefined, date: todayISO(), description: "Sale" },
    { type: "cash_sale", amount: 1240, related_id: undefined, date: todayISO(), description: "Sale" },
    { type: "cash_sale", amount: 320, related_id: undefined, date: todayISO(), description: "Sale" },
    { type: "udhaar_given", amount: 800, related_id: cust1, date: todayISO(), description: "Udhaar" },
    { type: "udhaar_given", amount: 450, related_id: cust2, date: todayISO(), description: "Udhaar" },
  ]);

  // bump cust1 / cust2 balances for today's udhaar
  await db.customers.update(cust1, { balance: 800 });
  await db.customers.update(cust2, { balance: 450 });
}
