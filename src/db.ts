import Dexie, { type Table } from "dexie";

export type RiskStatus = "good" | "risky";

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  balance: number;
  default_due_days: number;
  risk_status: RiskStatus;
}

export interface Supplier {
  id?: number;
  name: string;
  payable_balance: number;
}

export interface Item {
  id?: number;
  name: string;
  price: number;
  emoji: string;
  category: string;
}

export type TxType =
  | "cash_sale"
  | "udhaar_given"
  | "udhaar_recovered"
  | "supplier_credit_received"
  | "supplier_paid";

export interface Transaction {
  id?: number;
  type: TxType;
  amount: number;
  related_id?: number; // customer or supplier id
  date: string; // ISO
  description: string;
}

class KiryanaDB extends Dexie {
  customers!: Table<Customer, number>;
  suppliers!: Table<Supplier, number>;
  items!: Table<Item, number>;
  transactions!: Table<Transaction, number>;

  constructor() {
    super("KiryanaOS");
    this.version(1).stores({
      customers: "++id, name, phone, balance, default_due_days, risk_status",
      suppliers: "++id, name, payable_balance",
      items: "++id, name, price, category",
      transactions: "++id, type, amount, related_id, date",
    });
  }
}

export const db = new KiryanaDB();

export const todayISO = () => new Date().toISOString();
export const isToday = (iso: string) => {
  const d = new Date(iso);
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
};
export const daysSince = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};
