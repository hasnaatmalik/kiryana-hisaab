import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, todayISO, daysSince, oldestUnpaidUdhaarDate, type Customer } from "@/db";
import { rs } from "@/lib/format";
import { useUI } from "@/store";
import { X, Plus, Users } from "lucide-react";
import { AddCustomerModal } from "@/components/shared/AddCustomerModal";

export const UdhaarList = () => {
  const customers = useLiveQuery(() => db.customers.orderBy("name").toArray(), []);
  const [active, setActive] = useState<Customer | null>(null);
  const [adding, setAdding] = useState(false);

  if (!customers) return <div className="h-40 bg-muted animate-pulse border border-border" />;

  const withBalance = customers.filter((c) => c.balance > 0);
  const cleared = customers.filter((c) => c.balance <= 0);

  return (
    <div className="space-y-3">
      <div className="bg-card border-2 border-ink">
        <div className="px-4 py-3 border-b-2 border-ink flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h3 className="font-bold uppercase tracking-wide">Udhaar List</h3>
          </div>
          <span className="num text-sm text-muted-foreground">{withBalance.length} log</span>
        </div>

        <button
          onClick={() => setAdding(true)}
          className="w-full h-14 flex items-center justify-center gap-2 bg-ink text-background border-b-2 border-ink font-semibold active:translate-y-px"
        >
          <Plus className="h-5 w-5" />
          Naya Customer Add Karein
        </button>

        {withBalance.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">Sab clear hai 🎉</div>
        ) : (
          <ul className="divide-y divide-border">
            {withBalance.map((c) => (
              <CustomerRow key={c.id} c={c} onClick={() => setActive(c)} />
            ))}
          </ul>
        )}
      </div>

      {cleared.length > 0 && (
        <div className="bg-card border-2 border-ink">
          <div className="px-4 py-2 border-b-2 border-ink bg-paper text-xs uppercase tracking-wider font-bold text-muted-foreground">
            Clear customers ({cleared.length})
          </div>
          <ul className="divide-y divide-border">
            {cleared.map((c) => (
              <li key={c.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <span className="font-semibold">{c.name}</span>
                <span className="num text-muted-foreground">0</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {active && <UdhaarActionModal customer={active} onClose={() => setActive(null)} />}
      {adding && <AddCustomerModal onClose={() => setAdding(false)} />}
    </div>
  );
};

const CustomerRow = ({ c, onClick }: { c: Customer; onClick: () => void }) => {
  const oldestDate = useLiveQuery(() => oldestUnpaidUdhaarDate(c.id!), [c.id]);
  const days = oldestDate ? daysSince(oldestDate) : 0;
  const overdue = days >= c.default_due_days;

  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full px-4 py-3 flex items-center justify-between active:bg-paper text-left ${overdue ? "bg-udhaar/5" : ""}`}
      >
        <div className="min-w-0">
          <div className="font-semibold flex items-center gap-2 flex-wrap">
            {c.name}
            {overdue && (
              <span className="text-[10px] uppercase font-bold bg-udhaar text-udhaar-foreground px-1.5 py-0.5">
                Risky
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground num">
            {oldestDate ? `${days} din se baqi` : "Naya"}
            {" • "}due {c.default_due_days}d
          </div>
        </div>
        <div className="num text-lg font-bold text-udhaar">{rs(c.balance)}</div>
      </button>
    </li>
  );
};

const UdhaarActionModal = ({ customer, onClose }: { customer: Customer; onClose: () => void }) => {
  const [amount, setAmount] = useState("");
  const showFlash = useUI((s) => s.showFlash);

  const submit = async (action: "give" | "recover") => {
    const a = parseFloat(amount);
    if (!a || a <= 0) return;
    
    await db.transaction("rw", db.customers, db.transactions, async () => {
      if (action === "recover") {
        const wasool = Math.min(a, customer.balance);
        await db.customers.update(customer.id!, { balance: customer.balance - wasool });
        await db.transactions.add({
          type: "udhaar_recovered",
          amount: wasool,
          related_id: customer.id,
          date: todayISO(),
          description: `${customer.name} se wasool`,
        });
        showFlash("Wasool ho gaya!");
      } else {
        await db.customers.update(customer.id!, { balance: customer.balance + a });
        await db.transactions.add({
          type: "udhaar_given",
          amount: a,
          related_id: customer.id,
          date: todayISO(),
          description: `${customer.name} ko udhaar diya`,
        });
        showFlash("Udhaar entry ho gayi!");
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-end sm:items-center justify-center">
      <div className="bg-background w-full sm:max-w-sm border-t-2 sm:border-2 border-ink p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">{customer.name}</h2>
            <p className="text-sm text-muted-foreground num">
              Pending: <span className="text-udhaar font-bold">{rs(customer.balance)}</span>
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
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 h-14 bg-transparent num text-2xl font-bold outline-none pr-3"
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => submit("give")}
            className="w-full h-14 bg-udhaar text-udhaar-foreground border-2 border-ink font-bold text-base active:translate-y-px"
          >
            Udhaar Diya
          </button>
          <button
            onClick={() => submit("recover")}
            className="w-full h-14 bg-cash text-cash-foreground border-2 border-ink font-bold text-base active:translate-y-px"
          >
            Wasool Karo
          </button>
        </div>
      </div>
    </div>
  );
};
