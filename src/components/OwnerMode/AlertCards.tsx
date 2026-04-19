import { useLiveQuery } from "dexie-react-hooks";
import { db, daysSince, type Customer } from "@/db";
import { rs } from "@/lib/format";
import { MessageCircle, AlertTriangle } from "lucide-react";

const sendReminder = (customer: Customer) => {
  const message = encodeURIComponent(
    `Assalam-o-Alaikum ${customer.name} bhai! Aapka pichla udhaar Rs. ${customer.balance} pending hai. Kirpya jald ada karein. Shukriya!`,
  );
  window.open(`https://wa.me/92${customer.phone}?text=${message}`, "_blank");
};

const lastUdhaarDate = async (customerId: number) => {
  const tx = await db.transactions
    .where("type").equals("udhaar_given")
    .and((t) => t.related_id === customerId).toArray();
  if (tx.length === 0) return null;
  return tx.sort((a, b) => +new Date(b.date) - +new Date(a.date))[0].date;
};

export const AlertCards = () => {
  const customers = useLiveQuery(
    () => db.customers.filter((c) => c.balance > 0).toArray(),
    [],
  );

  if (!customers) return <div className="h-40 bg-muted animate-pulse border border-border" />;

  return (
    <div className="space-y-3">
      <div className="bg-card border-2 border-ink px-4 py-3 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-udhaar" />
        <h3 className="font-bold uppercase tracking-wide">Koi Masla?</h3>
      </div>
      {customers.map((c) => (
        <AlertRow key={c.id} c={c} />
      ))}
      {customers.length === 0 && (
        <div className="bg-card border-2 border-ink p-6 text-center text-muted-foreground">
          Koi masla nahi 👍
        </div>
      )}
    </div>
  );
};

const AlertRow = ({ c }: { c: Customer }) => {
  const lastDate = useLiveQuery(() => lastUdhaarDate(c.id!), [c.id]);
  const days = lastDate ? daysSince(lastDate) : 0;
  const overdue = days > c.default_due_days;
  if (!overdue) return null;
  return (
    <div className="bg-card border-2 border-ink p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-bold text-base">{c.name}</div>
          <div className="text-xs text-muted-foreground num">
            📞 0{c.phone}
          </div>
          <div className="text-xs num mt-1">
            <span className="text-udhaar font-bold">{days} din</span> overdue
          </div>
        </div>
        <div className="num text-xl font-black text-udhaar">{rs(c.balance)}</div>
      </div>
      <button
        onClick={() => sendReminder(c)}
        className="w-full h-12 bg-cash text-cash-foreground border-2 border-ink font-semibold flex items-center justify-center gap-2 active:translate-y-px"
      >
        <MessageCircle className="h-4 w-4" />
        Yaad Dilao (WhatsApp)
      </button>
    </div>
  );
};
