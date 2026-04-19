import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, isToday } from "@/db";
import { rs } from "@/lib/format";
import { Calendar } from "lucide-react";

export const SaleCard = () => {
  const tx = useLiveQuery(() => db.transactions.toArray(), []);
  const [galla, setGalla] = useState<string>("");

  if (!tx) {
    return <div className="h-40 bg-muted animate-pulse border border-border" />;
  }

  const today = tx.filter((t) => isToday(t.date));
  const cashSales = today.filter((t) => t.type === "cash_sale").reduce((s, t) => s + t.amount, 0);
  const udhaarGiven = today.filter((t) => t.type === "udhaar_given").reduce((s, t) => s + t.amount, 0);
  const udhaarRec = today.filter((t) => t.type === "udhaar_recovered").reduce((s, t) => s + t.amount, 0);
  const supplierPaid = today.filter((t) => t.type === "supplier_paid").reduce((s, t) => s + t.amount, 0);
  const supplierCredit = today.filter((t) => t.type === "supplier_credit_received").reduce((s, t) => s + t.amount, 0);

  // Total sales today (all goods that left the shop)
  const totalSales = cashSales + udhaarGiven;
  const expected = cashSales + udhaarRec - supplierPaid;
  const actual = parseFloat(galla) || 0;
  const diff = actual - expected;

  return (
    <div className="space-y-3">
      <div className="bg-card border-2 border-ink p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base uppercase tracking-wide">Aaj ki Sale</h3>
          <span className="text-xs text-muted-foreground num flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date().toLocaleDateString("en-PK")}
          </span>
        </div>

        {/* Headline */}
        <div className="bg-ink text-background border-2 border-ink p-3">
          <div className="text-[10px] uppercase tracking-wider opacity-80">Total sale aaj</div>
          <div className="num text-3xl font-black">{rs(totalSales)}</div>
          <div className="text-[11px] opacity-80 num mt-1">
            Cash {rs(cashSales)} + Udhaar {rs(udhaarGiven)}
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Cash mila" value={cashSales} tone="cash" />
          <Stat label="Udhaar diya" value={udhaarGiven} tone="udhaar" />
          <Stat label="Wasool hua" value={udhaarRec} tone="cash" />
          <Stat label="Supplier ko diya" value={supplierPaid} tone="udhaar" />
        </div>

        {supplierCredit > 0 && (
          <div className="text-xs text-muted-foreground num text-center border-t border-border pt-2">
            Aaj udhaar pe maal liya: <span className="font-bold text-udhaar">{rs(supplierCredit)}</span>
          </div>
        )}
      </div>

      {/* Reconciliation */}
      <div className="bg-card border-2 border-ink p-4 space-y-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Galla check</div>
          <div className="text-sm mt-1">
            Aapke paas <span className="font-bold num">{rs(expected)}</span> hone chahiye.
          </div>
        </div>

        <label className="text-sm font-semibold block">Galla mein kitna cash hai?</label>
        <div className="flex items-center border-2 border-ink bg-paper">
          <span className="px-3 num font-bold">Rs.</span>
          <input
            type="number"
            inputMode="numeric"
            value={galla}
            onChange={(e) => setGalla(e.target.value)}
            placeholder="0"
            className="flex-1 h-12 bg-transparent num text-2xl font-bold outline-none pr-3"
          />
        </div>

        {galla !== "" && (
          <div
            className={`p-3 border-2 border-ink num font-bold text-center ${
              diff === 0
                ? "bg-cash text-cash-foreground"
                : diff > 0
                  ? "bg-cash text-cash-foreground"
                  : "bg-udhaar text-udhaar-foreground"
            }`}
          >
            {diff === 0
              ? "Bilkul sahi! Hisaab pakka."
              : diff > 0
                ? `Rs. ${Math.abs(diff).toLocaleString("en-PK")} zyada hai`
                : `Rs. ${Math.abs(diff).toLocaleString("en-PK")} kam hai`}
          </div>
        )}
      </div>
    </div>
  );
};

const Stat = ({ label, value, tone }: { label: string; value: number; tone: "cash" | "udhaar" }) => (
  <div className="border border-border bg-paper p-2">
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className={`num text-base font-bold ${tone === "cash" ? "text-cash" : "text-udhaar"}`}>
      {rs(value)}
    </div>
  </div>
);
