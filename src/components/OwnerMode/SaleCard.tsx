import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, isToday, todayISO } from "@/db";
import { rs } from "@/lib/format";
import { Calendar, RotateCcw, Plus, X } from "lucide-react";
import { useUI } from "@/store";

export const SaleCard = () => {
  const tx = useLiveQuery(() => db.transactions.toArray(), []);
  const [galla, setGalla] = useState<string>("");
  const [showManualCash, setShowManualCash] = useState(false);

  if (!tx) {
    return <div className="h-40 bg-muted animate-pulse border border-border" />;
  }

  const today = tx.filter((t) => isToday(t.date));
  const cashSales = today.filter((t) => t.type === "cash_sale").reduce((s, t) => s + t.amount, 0);
  const udhaarGiven = today.filter((t) => t.type === "udhaar_given").reduce((s, t) => s + t.amount, 0);
  const udhaarRec = today.filter((t) => t.type === "udhaar_recovered").reduce((s, t) => s + t.amount, 0);
  const supplierPaid = today.filter((t) => t.type === "supplier_paid").reduce((s, t) => s + t.amount, 0);
  const supplierCredit = today.filter((t) => t.type === "supplier_credit_received").reduce((s, t) => s + t.amount, 0);

  const totalSales = cashSales + udhaarGiven;
  const expected = cashSales + udhaarRec - supplierPaid;
  const actual = parseFloat(galla) || 0;
  const diff = actual - expected;

  const handleResetSale = async () => {
    if (window.confirm("⚠️ WARNING: Kiya aap wakayi aaj ki saari sale (cash + udhaar) delete karna chahte hain? Yeh waapis nahi aayegi.")) {
      const todayIds = today.map(t => t.id).filter((id): id is number => id !== undefined);
      if (todayIds.length > 0) {
        await db.transactions.bulkDelete(todayIds);
        setGalla("");
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-card border-2 border-ink p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base uppercase tracking-wide">Aaj ki Sale</h3>
            {today.length > 0 && (
              <button 
                onClick={handleResetSale}
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                title="Reset Aaj ki Sale"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
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
        
        <div className="pt-2 border-t border-border">
          <button 
            onClick={() => setShowManualCash(true)}
            className="w-full h-12 flex items-center justify-center gap-2 border-2 border-ink bg-paper font-bold text-sm active:translate-y-px"
          >
            <Plus className="h-4 w-4" />
            Manual Cash Entry
          </button>
        </div>
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
      
      {showManualCash && <ManualCashModal onClose={() => setShowManualCash(false)} />}
    </div>
  );
};

const ManualCashModal = ({ onClose }: { onClose: () => void }) => {
  const [amount, setAmount] = useState("");
  const showFlash = useUI((s) => s.showFlash);

  const submit = async () => {
    const a = parseFloat(amount);
    if (!a || a <= 0) return;
    await db.transactions.add({
      type: "cash_sale",
      amount: a,
      date: todayISO(),
      description: "Manual Cash Entry",
    });
    showFlash("Cash entry save ho gayi!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-end sm:items-center justify-center">
      <div className="bg-background w-full sm:max-w-sm border-t-2 sm:border-2 border-ink p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">Manual Cash Entry</h2>
            <p className="text-sm text-muted-foreground">Bina items ke cash entry karen</p>
          </div>
          <button onClick={onClose} className="h-10 w-10 grid place-items-center border border-border">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex items-center border-2 border-ink bg-paper">
          <span className="px-3 num font-bold">Rs.</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 h-14 bg-transparent num text-2xl font-bold outline-none pr-3"
            autoFocus
          />
        </div>
        
        <button
          onClick={submit}
          className="w-full h-14 bg-cash text-cash-foreground border-2 border-ink font-bold text-lg active:translate-y-px"
        >
          Save Cash
        </button>
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
