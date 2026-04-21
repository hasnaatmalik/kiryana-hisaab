import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase environment variables. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type RiskStatus = "good" | "risky";

export interface Customer {
  id: number;
  name: string;
  phone: string;
  balance: number;
  default_due_days: number;
  risk_status: RiskStatus;
}

export interface Supplier {
  id: number;
  name: string;
  payable_balance: number;
}

export interface Item {
  id: number;
  name: string;
  price: number;
  emoji: string;
  category: string;
  description: string | null;
  image_url: string | null;
}

export type TxType =
  | "cash_sale"
  | "udhaar_given"
  | "udhaar_recovered"
  | "supplier_credit_received"
  | "supplier_paid";

export interface Transaction {
  id: number;
  type: TxType;
  amount: number;
  related_id: number | null;
  date: string;
  description: string;
}
