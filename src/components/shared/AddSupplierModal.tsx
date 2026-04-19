import { useState } from "react";
import { db } from "@/db";
import { useUI } from "@/store";
import { X } from "lucide-react";

export const AddSupplierModal = ({ onClose }: { onClose: () => void }) => {
  const [name, setName] = useState("");
  const [opening, setOpening] = useState("0");
  const showFlash = useUI((s) => s.showFlash);

  const submit = async () => {
    if (!name.trim()) return;
    await db.suppliers.add({
      name: name.trim(),
      payable_balance: parseFloat(opening) || 0,
    });
    showFlash("Supplier add ho gaya!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-end sm:items-center justify-center">
      <div className="bg-background w-full sm:max-w-sm border-t-2 sm:border-2 border-ink p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Naya Supplier</h2>
          <button onClick={onClose} className="h-10 w-10 grid place-items-center border border-border">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Naam</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Supplier ka naam"
            className="w-full h-12 bg-paper border-2 border-ink px-3 outline-none font-semibold"
            autoFocus
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
            Pehle se kitna dena hai? (Rs.)
          </label>
          <input
            value={opening}
            onChange={(e) => setOpening(e.target.value)}
            inputMode="numeric"
            type="number"
            className="w-full h-12 bg-paper border-2 border-ink px-3 outline-none num font-bold"
          />
        </div>
        <button
          onClick={submit}
          className="w-full h-14 bg-ink text-background border-2 border-ink font-bold text-lg active:translate-y-px"
        >
          Save Karo
        </button>
      </div>
    </div>
  );
};
