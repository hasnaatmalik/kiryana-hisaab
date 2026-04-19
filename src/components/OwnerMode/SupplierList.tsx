import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, todayISO, type Supplier } from "@/db";
import { rs } from "@/lib/format";
import { useUI } from "@/store";
import { X } from "lucide-react";

export const SupplierList = () => {
  const suppliers = useLiveQuery(() => db.suppliers.toArray(), []);
  const [active, setActive] = useState<{ s: Supplier; mode: "in" | "out" } | null>(null);

  if (!suppliers) return <div className="h-40 bg-muted animate-pulse border border-border" />;

  return (
    <div className="bg-card border-2 border-ink">
      <div className="px-4 py-3 border-b-2 border-ink">
        <h3 className="font-bold uppercase tracking-wide">Supplier Hisaab</h3>
      </div>
      <ul className="divide-y divide-border">
        {suppliers.map((s) => (
          <li key={s.id} className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">{s.name}</div>
              <div className={`num font-bold ${s.payable_balance > 0 ? "text-udhaar" : "text-muted-foreground"}`}>
                {rs(s.payable_balance)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActive({ s, mode: "in" })}
                className="h-12 border-2 border-ink bg-paper font-semibold text-sm active:translate-y-px"
              >
                Maal Aaya
              </button>
              <button
                onClick={() => setActive({ s, mode: "out" })}
                className="h-12 border-2 border-ink bg-cash text-cash-foreground font-semibold text-sm active:translate-y-px"
              >
                Payment Di
              </button>
            </div>
          </li>
        ))}
      </ul>
      {active && (
        <SupplierActionModal
          supplier={active.s}
          mode={active.mode}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
};

const SupplierActionModal = ({
  supplier, mode, onClose,
}: { supplier: Supplier; mode: "in" | "out"; onClose: () => void }) => {
  const [amount, setAmount] = useState("");
  const showFlash = useUI((s) => s.showFlash);
  const isIn = mode === "in";

  const submit = async () => {
    const a = parseFloat(amount);
    if (!a || a <= 0) return;
    await db.transaction("rw", db.suppliers, db.transactions, async () => {
      const next = isIn
        ? supplier.payable_balance + a
        : Math.max(0, supplier.payable_balance - a);
      await db.suppliers.update(supplier.id!, { payable_balance: next });
      await db.transactions.add({
        type: isIn ? "supplier_credit_received" : "supplier_paid",
        amount: a,
        related_id: supplier.id,
        date: todayISO(),
        description: `${supplier.name} — ${isIn ? "maal aaya" : "payment di"}`,
      });
    });
    showFlash(isIn ? "Maal entry ho gayi!" : "Payment ho gayi!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-end sm:items-center justify-center">
      <div className="bg-background w-full sm:max-w-sm border-t-2 sm:border-2 border-ink p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">{supplier.name}</h2>
            <p className="text-sm text-muted-foreground">
              {isIn ? "Maal aaya — kitne ka?" : "Kitni payment di?"}
            </p>
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
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 h-14 bg-transparent num text-2xl font-bold outline-none pr-3"
            autoFocus
          />
        </div>
        <button
          onClick={submit}
          className={`w-full h-14 border-2 border-ink font-bold text-lg active:translate-y-px ${
            isIn ? "bg-udhaar text-udhaar-foreground" : "bg-cash text-cash-foreground"
          }`}
        >
          {isIn ? "Save Karo" : "Payment Save Karo"}
        </button>
      </div>
    </div>
  );
};
