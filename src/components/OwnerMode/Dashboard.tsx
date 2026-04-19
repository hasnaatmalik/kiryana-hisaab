import { useLiveQuery } from "dexie-react-hooks";
import { db, isToday } from "@/db";
import { rs } from "@/lib/format";
import { TrendingUp, TrendingDown, Wallet, Users, Truck, PackageCheck, PackageOpen, BarChart3 } from "lucide-react";

export const Dashboard = () => {
  const tx = useLiveQuery(() => db.transactions.toArray(), []);
  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const suppliers = useLiveQuery(() => db.suppliers.toArray(), []);

  if (!tx || !customers || !suppliers) {
    return <div className="h-60 bg-muted animate-pulse border border-border" />;
  }

  const sum = (filter: (t: typeof tx[number]) => boolean) =>
    tx.filter(filter).reduce((s, t) => s + t.amount, 0);

  const allCash = sum((t) => t.type === "cash_sale");
  const allUdhaarGiven = sum((t) => t.type === "udhaar_given");
  const allWasool = sum((t) => t.type === "udhaar_recovered");
  const allSupplierPaid = sum((t) => t.type === "supplier_paid");
  const allSupplierCredit = sum((t) => t.type === "supplier_credit_received");

  const inflow = allCash + allWasool;
  const outflow = allSupplierPaid;
  const netCash = inflow - outflow;

  const totalUdhaarOutstanding = customers.reduce((s, c) => s + c.balance, 0);
  const totalSupplierPayable = suppliers.reduce((s, s2) => s + s2.payable_balance, 0);

  // Approx profit: revenue (cash + udhaar booked) − cost (all stock taken from suppliers)
  const revenue = allCash + allUdhaarGiven;
  const cogs = allSupplierCredit + allSupplierPaid;
  const approxProfit = revenue - cogs;

  // Today vs all-time
  const todayCash = tx.filter((t) => isToday(t.date) && t.type === "cash_sale").reduce((s, t) => s + t.amount, 0);
  const todayUdhaar = tx.filter((t) => isToday(t.date) && t.type === "udhaar_given").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-3">
      <div className="bg-ink text-background border-2 border-ink px-4 py-3 flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        <h3 className="font-bold uppercase tracking-wide">Poora Hisaab</h3>
        <span className="ml-auto text-[10px] opacity-70 uppercase tracking-wider">All-time</span>
      </div>

      {/* Hero: Net cash + profit */}
      <div className="grid grid-cols-2 gap-3">
        <BigStat
          label="Net Cash"
          value={netCash}
          tone={netCash >= 0 ? "cash" : "udhaar"}
          icon={<Wallet className="h-4 w-4" />}
          sub={`In ${rs(inflow)} − Out ${rs(outflow)}`}
        />
        <BigStat
          label="Approx Munafa"
          value={approxProfit}
          tone={approxProfit >= 0 ? "cash" : "udhaar"}
          icon={<TrendingUp className="h-4 w-4" />}
          sub="Sale − stock cost"
        />
      </div>

      {/* Inflow / Outflow */}
      <div className="bg-card border-2 border-ink">
        <SectionTitle>Cash Inflow / Outflow</SectionTitle>
        <Row icon={<TrendingUp className="h-4 w-4 text-cash" />} label="Cash sales (all-time)" value={allCash} tone="cash" />
        <Row icon={<TrendingUp className="h-4 w-4 text-cash" />} label="Wasool (udhaar recovered)" value={allWasool} tone="cash" />
        <Row icon={<TrendingDown className="h-4 w-4 text-udhaar" />} label="Supplier ko payment" value={allSupplierPaid} tone="udhaar" />
        <Row label="Net Cash" value={netCash} tone={netCash >= 0 ? "cash" : "udhaar"} bold />
      </div>

      {/* Udhaar */}
      <div className="bg-card border-2 border-ink">
        <SectionTitle>Udhaar</SectionTitle>
        <Row icon={<Users className="h-4 w-4" />} label="Total udhaar diya (all-time)" value={allUdhaarGiven} />
        <Row icon={<Users className="h-4 w-4 text-cash" />} label="Total wasool" value={allWasool} tone="cash" />
        <Row label="Pending — logon par baqi" value={totalUdhaarOutstanding} tone="udhaar" bold />
      </div>

      {/* Supplier */}
      <div className="bg-card border-2 border-ink">
        <SectionTitle>Supplier Hisaab</SectionTitle>
        <Row icon={<PackageCheck className="h-4 w-4" />} label="Naqad samaan liya" value={allSupplierPaid} />
        <Row icon={<PackageOpen className="h-4 w-4 text-udhaar" />} label="Udhaar samaan liya" value={allSupplierCredit} tone="udhaar" />
        <Row icon={<Truck className="h-4 w-4 text-udhaar" />} label="Supplier ko dena hai" value={totalSupplierPayable} tone="udhaar" bold />
      </div>

      {/* Today snapshot */}
      <div className="bg-paper border-2 border-ink p-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Aaj ka quick snapshot</div>
        <div className="grid grid-cols-2 gap-2">
          <Mini label="Aaj cash" value={todayCash} tone="cash" />
          <Mini label="Aaj udhaar" value={todayUdhaar} tone="udhaar" />
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground text-center px-4">
        * Munafa approx hai — har item ka exact cost track nahi hota. Sirf supplier total se andaaza.
      </p>
    </div>
  );
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="px-4 py-2 border-b-2 border-ink bg-paper text-xs uppercase tracking-wider font-bold">
    {children}
  </div>
);

const Row = ({
  icon, label, value, tone, bold,
}: {
  icon?: React.ReactNode; label: string; value: number;
  tone?: "cash" | "udhaar"; bold?: boolean;
}) => (
  <div className={`flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0 ${bold ? "bg-paper" : ""}`}>
    <div className="flex items-center gap-2 text-sm">
      {icon}
      <span className={bold ? "font-bold" : ""}>{label}</span>
    </div>
    <div className={`num ${bold ? "text-lg font-black" : "text-base font-bold"} ${tone === "cash" ? "text-cash" : tone === "udhaar" ? "text-udhaar" : ""}`}>
      {rs(value)}
    </div>
  </div>
);

const BigStat = ({
  label, value, tone, icon, sub,
}: {
  label: string; value: number; tone: "cash" | "udhaar";
  icon: React.ReactNode; sub?: string;
}) => (
  <div className={`border-2 border-ink p-3 ${tone === "cash" ? "bg-cash text-cash-foreground" : "bg-udhaar text-udhaar-foreground"}`}>
    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider opacity-90">
      {icon}{label}
    </div>
    <div className="num text-2xl font-black mt-1 leading-tight">{rs(value)}</div>
    {sub && <div className="text-[10px] opacity-80 mt-1 num">{sub}</div>}
  </div>
);

const Mini = ({ label, value, tone }: { label: string; value: number; tone: "cash" | "udhaar" }) => (
  <div className="bg-card border border-border p-2">
    <div className="text-[10px] uppercase text-muted-foreground tracking-wide">{label}</div>
    <div className={`num text-base font-bold ${tone === "cash" ? "text-cash" : "text-udhaar"}`}>{rs(value)}</div>
  </div>
);
