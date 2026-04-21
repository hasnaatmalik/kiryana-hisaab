import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, todayISO, type Supplier } from "@/db";
import { rs } from "@/lib/format";
import { useUI } from "@/store";
import { X, Plus, Truck } from "lucide-react";
import { AddSupplierModal } from "@/components/shared/AddSupplierModal";

export const SupplierList = () => {
  const suppliers = useLiveQuery(() => db.suppliers.orderBy("name").toArray(), []);
  const [active, setActive] = useState<Supplier | null>(null);
  const [adding, setAdding] = useState(false);

  if (!suppliers) return <div className="h-40 bg-muted animate-pulse border border-border" />;

  return (
    <div className="space-y-3">
      <div className="bg-card border-2 border-ink">
        <div className="px-4 py-3 border-b-2 border-ink flex items-center gap-2">
          <Truck className="h-5 w-5" />
          <h3 className="font-bold uppercase tracking-wide">Supplier Hisaab</h3>
        </div>

        <button
          onClick={() => setAdding(true)}
          className="w-full h-14 flex items-center justify-center gap-2 bg-ink text-background border-b-2 border-ink font-semibold active:translate-y-px"
        >
          <Plus className="h-5 w-5" />
          Naya Supplier Add Karein
        </button>

        {suppliers.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">Koi supplier nahi.</div>
        ) : (
          <ul className="divide-y divide-border">
            {suppliers.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setActive(s)}
                  className="w-full px-4 py-3 text-left active:bg-paper flex items-center justify-between"
                >
                  <span className="font-semibold">{s.name}</span>
                  <span className={`num font-bold ${s.payable_balance > 0 ? "text-udhaar" : "text-muted-foreground"}`}>
                    {rs(s.payable_balance)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {active && (
        <SupplierActionModal
          supplier={active}
          onClose={() => setActive(null)}
        />
      )}
      {adding && <AddSupplierModal onClose={() => setAdding(false)} />}
    </div>
  );
};

const SupplierActionModal = ({
  supplier, onClose,
}: { supplier: Supplier; onClose: () => void }) => {
  const [amount, setAmount] = useState("");
  const showFlash = useUI((s) => s.showFlash);

  const submit = async (action: "credit" | "naqad" | "payment") => {
    const a = parseFloat(amount);
    if (!a || a <= 0) return;

    await db.transaction("rw", db.suppliers, db.transactions, async () => {
      if (action === "credit") {
        // Maal aaya, baad mein pay karein — adds to payable
        await db.suppliers.update(supplier.id!, { payable_balance: supplier.payable_balance + a });
        await db.transactions.add({
          type: "supplier_credit_received",
          amount: a,
          related_id: supplier.id,
          date: todayISO(),
          description: `${supplier.name} — udhaar maal liya`,
        });
        showFlash("Maal entry ho gayi! (Udhaar)");
      } else if (action === "naqad") {
        // Maal aaya, cash de dia abhi — does NOT add to payable
        await db.transactions.add({
          type: "supplier_paid",
          amount: a,
          related_id: supplier.id,
          date: todayISO(),
          description: `${supplier.name} — naqad maal liya`,
        });
        showFlash("Naqad maal entry ho gayi!");
      } else {
        // Payment of existing dues
        const next = Math.max(0, supplier.payable_balance - a);
        await db.suppliers.update(supplier.id!, { payable_balance: next });
        await db.transactions.add({
          type: "supplier_paid",
          amount: a,
          related_id: supplier.id,
          date: todayISO(),
          description: `${supplier.name} — payment di`,
        });
        showFlash("Payment ho gayi!");
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-end sm:items-center justify-center">
      <div className="bg-background w-full sm:max-w-sm border-t-2 sm:border-2 border-ink p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">{supplier.name}</h2>
            <p className="text-sm text-muted-foreground num">
              Baaki dena: <span className="font-bold text-udhaar">{rs(supplier.payable_balance)}</span>
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
            placeholder="Amount"
            className="flex-1 h-14 bg-transparent num text-2xl font-bold outline-none pr-3"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => submit("credit")}
              className="h-14 bg-udhaar text-udhaar-foreground border-2 border-ink font-bold text-sm active:translate-y-px leading-tight px-2"
            >
              Maal Aaya<br/><span className="font-normal text-xs opacity-80">(Udhaar — baad mein denge)</span>
            </button>
            <button
              onClick={() => submit("naqad")}
              className="h-14 bg-paper border-2 border-ink font-bold text-sm active:translate-y-px leading-tight px-2"
            >
              Naqad Maal Liya<br/><span className="font-normal text-xs text-muted-foreground">(Cash abhi de dia)</span>
            </button>
          </div>
          <button
            onClick={() => submit("payment")}
            className="w-full h-12 bg-cash text-cash-foreground border-2 border-ink font-bold text-base active:translate-y-px"
          >
            Purana Udhaar Diya
          </button>
        </div>
      </div>
    </div>
  );
};
