import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, isToday } from "@/db";
import { rs } from "@/lib/format";

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
  const expected = cashSales + udhaarRec - supplierPaid;
  const actual = parseFloat(galla) || 0;
  const diff = actual - expected;

  return (
    <div className="bg-card border-2 border-ink p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-base uppercase tracking-wide">Aaj ki Sale</h3>
        <span className="text-xs text-muted-foreground num">
          {new Date().toLocaleDateString("en-PK")}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Cash" value={cashSales} tone="cash" />
        <Stat label="Udhaar diya" value={udhaarGiven} tone="udhaar" />
        <Stat label="Wasool" value={udhaarRec} tone="cash" />
      </div>

      <div className="border-t border-border pt-3 space-y-2">
        <label className="text-sm font-semibold">Galla mein kitna cash hai?</label>
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
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">Expected:</span>
          <span className="num font-bold">{rs(expected)}</span>
        </div>
        {galla !== "" && (
          <div
            className={`p-3 border-2 border-ink num font-bold text-center ${
              diff >= 0 ? "bg-cash text-cash-foreground" : "bg-udhaar text-udhaar-foreground"
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
