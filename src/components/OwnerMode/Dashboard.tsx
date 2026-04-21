import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { format } from "date-fns";
import { db, isToday } from "@/db";
import { rs } from "@/lib/format";
import { TrendingUp, TrendingDown, Wallet, Users, Truck, X, Calendar as CalendarIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const Dashboard = () => {
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [showDetail, setShowDetail] = useState(false);
  const tx = useLiveQuery(() => db.transactions.toArray(), []);
  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const suppliers = useLiveQuery(() => db.suppliers.toArray(), []);

  if (!tx || !customers || !suppliers) {
    return (
      <div className="space-y-3 p-3">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse border border-border" />)}
      </div>
    );
  }

  const activeTx = filterDate
    ? tx.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === filterDate.getFullYear() &&
        d.getMonth() === filterDate.getMonth() &&
        d.getDate() === filterDate.getDate();
    })
    : tx;

  const sum = (filter: (t: typeof tx[number]) => boolean) =>
    activeTx.filter(filter).reduce((s, t) => s + t.amount, 0);

  const allCash = sum((t) => t.type === "cash_sale");
  const allUdhaarGiven = sum((t) => t.type === "udhaar_given");
  const allWasool = sum((t) => t.type === "udhaar_recovered");
  const allSupplierPaid = sum((t) => t.type === "supplier_paid");
  const allSupplierCredit = sum((t) => t.type === "supplier_credit_received");

  const netCash = allCash + allWasool - allSupplierPaid;
  const revenue = allCash + allUdhaarGiven;
  const approxProfit = revenue - (allSupplierCredit + allSupplierPaid);

  // Always from full tx — not filtered
  const totalUdhaarOutstanding = customers.reduce((s, c) => s + c.balance, 0);
  const totalSupplierPayable = suppliers.reduce((s, s2) => s + s2.payable_balance, 0);
  const todayCash = tx.filter((t) => isToday(t.date) && t.type === "cash_sale").reduce((s, t) => s + t.amount, 0);
  const todayUdhaar = tx.filter((t) => isToday(t.date) && t.type === "udhaar_given").reduce((s, t) => s + t.amount, 0);

  const isFiltered = !!filterDate;

  return (
    <div className="space-y-3">

      {/* ── Date filter header ── */}
      <div className="bg-ink text-background px-4 py-3 flex items-center gap-2">
        <h3 className="font-bold uppercase tracking-wide text-sm">Hisaab Kitaab</h3>
        <div className="ml-auto flex items-center gap-2">
          {filterDate && (
            <button onClick={() => setFilterDate(undefined)} title="Filter hatao" className="p-1 opacity-70 hover:opacity-100">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn("text-[11px] flex items-center gap-1.5 border-b border-background/40 pb-0.5", !filterDate && "text-background/60")}>
                <CalendarIcon className="h-3 w-3" />
                {filterDate ? format(filterDate, "PP") : "Pick a date"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[100] border-2 border-ink" align="end">
              <Calendar mode="single" selected={filterDate} onSelect={(d) => setFilterDate(d)} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ── Today's quick snapshot (only when no date filter) ── */}
      {!isFiltered && (
        <div className="grid grid-cols-2 gap-2 px-1">
          <TodayCard label="Aaj Cash" sublabel="Chota se mila" value={todayCash} tone="cash" />
          <TodayCard label="Aaj Udhaar" sublabel="Diya aaj" value={todayUdhaar} tone="udhaar" />
        </div>
      )}

      {/* ── 4 hero stats ── */}
      <div className="grid grid-cols-2 gap-2 px-1">
        <HeroStat label="Net Cash" value={netCash} tone={netCash >= 0 ? "cash" : "udhaar"} icon={<Wallet className="h-4 w-4" />} />
        <HeroStat label={isFiltered ? "Munafa (din)" : "Approx Munafa"} value={approxProfit} tone={approxProfit >= 0 ? "cash" : "udhaar"} icon={<TrendingUp className="h-4 w-4" />} />
        <HeroStat label="Logon ka Udhaar" value={totalUdhaarOutstanding} tone="udhaar" icon={<Users className="h-4 w-4" />} alwaysFull />
        <HeroStat label="Supplier ko Dena" value={totalSupplierPayable} tone="udhaar" icon={<Truck className="h-4 w-4" />} alwaysFull />
      </div>

      {/* ── Expandable breakdown ── */}
      <button
        onClick={() => setShowDetail(v => !v)}
        className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-ink bg-paper text-xs font-bold uppercase tracking-wider"
      >
        {showDetail ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {showDetail ? "Kam Dikhao" : "Poora Breakdown Dekho"}
      </button>

      {showDetail && (
        <div className="space-y-2">
          {/* Cash breakdown */}
          <Section title="Cash ka Hisaab">
            <DetailRow icon={<TrendingUp className="h-4 w-4 text-cash" />} label="Sale cash" value={allCash} tone="cash" />
            <DetailRow icon={<TrendingUp className="h-4 w-4 text-cash" />} label="Wasool (udhaar wapas)" value={allWasool} tone="cash" />
            <DetailRow icon={<TrendingDown className="h-4 w-4 text-udhaar" />} label="Supplier ko diya" value={allSupplierPaid} tone="udhaar" />
            <DetailRow label="Net Cash bacha" value={netCash} tone={netCash >= 0 ? "cash" : "udhaar"} bold />
          </Section>

          {/* Udhaar breakdown */}
          <Section title="Udhaar ka Hisaab">
            <DetailRow icon={<Users className="h-4 w-4" />} label="Udhaar diya" value={allUdhaarGiven} />
            <DetailRow icon={<Users className="h-4 w-4 text-cash" />} label="Wasool kiya" value={allWasool} tone="cash" />
            <DetailRow label="Baaki — logon par" value={totalUdhaarOutstanding} tone="udhaar" bold />
          </Section>

          {/* Supplier breakdown */}
          <Section title="Supplier ka Hisaab">
            <DetailRow label="Naqad maal liya" value={allSupplierPaid} />
            <DetailRow icon={<Truck className="h-4 w-4 text-udhaar" />} label="Udhaar maal liya" value={allSupplierCredit} tone="udhaar" />
            <DetailRow label="Abhi dena hai" value={totalSupplierPayable} tone="udhaar" bold />
          </Section>

          <p className="text-[10px] text-muted-foreground text-center px-4 pb-1">
            * Munafa approximate hai — supplier cost se andaaza lagaya gaya hai
          </p>
        </div>
      )}
    </div>
  );
};

// ── Sub-components ──────────────────────────────────────────────

const TodayCard = ({ label, sublabel, value, tone }: { label: string; sublabel: string; value: number; tone: "cash" | "udhaar" }) => (
  <div className="bg-card border-2 border-ink p-3">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{sublabel}</div>
    <div className="text-xs font-bold uppercase mt-0.5">{label}</div>
    <div className={`num text-xl font-black mt-1 ${tone === "cash" ? "text-cash" : "text-udhaar"}`}>{rs(value)}</div>
  </div>
);

const HeroStat = ({
  label, value, tone, icon, alwaysFull,
}: {
  label: string; value: number; tone: "cash" | "udhaar"; icon: React.ReactNode; alwaysFull?: boolean;
}) => (
  <div className={`border-2 border-ink p-3 ${tone === "cash" ? "bg-cash text-cash-foreground" : "bg-udhaar text-udhaar-foreground"}`}>
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider opacity-90">
      {icon}
      <span>{label}</span>
    </div>
    <div className="num text-2xl font-black mt-1 leading-none">{rs(value)}</div>
    {alwaysFull && <div className="text-[9px] opacity-70 mt-1 uppercase tracking-wide">Total outstanding</div>}
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-card border-2 border-ink">
    <div className="px-4 py-2 border-b-2 border-ink bg-paper text-xs font-bold uppercase tracking-wider">{title}</div>
    {children}
  </div>
);

const DetailRow = ({
  icon, label, value, tone, bold,
}: {
  icon?: React.ReactNode; label: string; value: number; tone?: "cash" | "udhaar"; bold?: boolean;
}) => (
  <div className={`flex items-center justify-between px-4 py-2.5 border-b border-border last:border-b-0 ${bold ? "bg-paper" : ""}`}>
    <div className="flex items-center gap-2 text-sm">
      {icon}
      <span className={bold ? "font-bold" : "text-muted-foreground"}>{label}</span>
    </div>
    <div className={`num ${bold ? "text-base font-black" : "text-sm font-bold"} ${tone === "cash" ? "text-cash" : tone === "udhaar" ? "text-udhaar" : ""}`}>
      {rs(value)}
    </div>
  </div>
);
