import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, todayISO, daysSince, type Customer } from "@/db";
import { rs } from "@/lib/format";
import { useUI } from "@/store";
import { X } from "lucide-react";

const lastUdhaarDate = async (customerId: number) => {
  const tx = await db.transactions
    .where("type")
    .equals("udhaar_given")
    .and((t) => t.related_id === customerId)
    .toArray();
  if (tx.length === 0) return null;
  return tx.sort((a, b) => +new Date(b.date) - +new Date(a.date))[0].date;
};

export const UdhaarList = () => {
  const customers = useLiveQuery(
    () => db.customers.filter((c) => c.balance > 0).toArray(),
    [],
  );
  const [selected, setSelected] = useState<Customer | null>(null);

  if (!customers) return <div className="h-40 bg-muted animate-pulse border border-border" />;

  return (
    <div className="bg-card border-2 border-ink">
      <div className="px-4 py-3 border-b-2 border-ink flex items-center justify-between">
        <h3 className="font-bold uppercase tracking-wide">Udhaar List</h3>
        <span className="num text-sm text-muted-foreground">
          {customers.length} log
        </span>
      </div>
      {customers.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground">Sab clear hai 🎉</div>
      ) : (
        <ul className="divide-y divide-border">
          {customers.map((c) => (
            <CustomerRow key={c.id} c={c} onClick={() => setSelected(c)} />
          ))}
        </ul>
      )}
      {selected && (
        <RecoverModal customer={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};

const CustomerRow = ({ c, onClick }: { c: Customer; onClick: () => void }) => {
  const lastDate = useLiveQuery(() => lastUdhaarDate(c.id!), [c.id]);
  const days = lastDate ? daysSince(lastDate) : 0;
  const overdue = days > c.default_due_days;
  return (
    <li>
      <button
        onClick={onClick}
        className="w-full px-4 py-3 flex items-center justify-between active:bg-paper text-left"
      >
        <div className="min-w-0">
          <div className="font-semibold flex items-center gap-2">
            {c.name}
            {overdue && (
              <span className="text-[10px] uppercase font-bold bg-udhaar text-udhaar-foreground px-1.5 py-0.5">
                Risky
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground num">
            {days} din pehle
          </div>
        </div>
        <div className="num text-lg font-bold text-udhaar">{rs(c.balance)}</div>
      </button>
    </li>
  );
};

const RecoverModal = ({ customer, onClose }: { customer: Customer; onClose: () => void }) => {
  const [amount, setAmount] = useState("");
  const showFlash = useUI((s) => s.showFlash);

  const submit = async () => {
    const a = parseFloat(amount);
    if (!a || a <= 0) return;
    const wasool = Math.min(a, customer.balance);
    await db.transaction("rw", db.customers, db.transactions, async () => {
      await db.customers.update(customer.id!, { balance: customer.balance - wasool });
      await db.transactions.add({
        type: "udhaar_recovered",
        amount: wasool,
        related_id: customer.id,
        date: todayISO(),
        description: `${customer.name} se wasool`,
      });
    });
    showFlash("Wasool ho gaya!");
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
        <button
          onClick={submit}
          className="w-full h-14 bg-cash text-cash-foreground border-2 border-ink font-bold text-lg active:translate-y-px"
        >
          Wasool Karo
        </button>
      </div>
    </div>
  );
};
