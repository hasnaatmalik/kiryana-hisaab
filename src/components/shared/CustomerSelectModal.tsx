import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { rs } from "@/lib/format";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  total: number;
  onClose: () => void;
  onPick: (customerId: number, name: string) => void;
}

export const CustomerSelectModal = ({ open, total, onClose, onPick }: Props) => {
  const customers = useLiveQuery(() => db.customers.orderBy("name").toArray(), []);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-end sm:items-center justify-center">
      <div className="bg-background w-full sm:max-w-md border-t-2 sm:border-2 border-ink max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b-2 border-ink">
          <div>
            <h2 className="text-lg font-bold">Udhaar — Kis ke naam?</h2>
            <p className="text-sm text-muted-foreground num">Total: {rs(total)}</p>
          </div>
          <button onClick={onClose} className="h-10 w-10 grid place-items-center border border-border">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto divide-y divide-border">
          {customers?.map((c) => (
            <button
              key={c.id}
              onClick={() => onPick(c.id!, c.name)}
              className="w-full flex items-center justify-between p-4 active:bg-paper text-left"
            >
              <div>
                <div className="font-semibold text-base">{c.name}</div>
                <div className="text-xs text-muted-foreground num">{c.phone}</div>
              </div>
              <div className={`num font-bold ${c.balance > 0 ? "text-udhaar" : "text-muted-foreground"}`}>
                {rs(c.balance)}
              </div>
            </button>
          ))}
          {customers?.length === 0 && (
            <div className="p-6 text-center text-muted-foreground">Koi customer nahi.</div>
          )}
        </div>
      </div>
    </div>
  );
};
