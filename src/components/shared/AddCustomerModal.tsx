import { useState } from "react";
import { db } from "@/db";
import { useUI } from "@/store";
import { X } from "lucide-react";

export const AddCustomerModal = ({ onClose }: { onClose: () => void }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [days, setDays] = useState("10");
  const showFlash = useUI((s) => s.showFlash);

  const submit = async () => {
    if (!name.trim()) return;
    await db.customers.add({
      name: name.trim(),
      phone: phone.replace(/\D/g, ""),
      balance: 0,
      default_due_days: parseInt(days) || 10,
      risk_status: "good",
    });
    showFlash("Customer add ho gaya!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-end sm:items-center justify-center">
      <div className="bg-background w-full sm:max-w-sm border-t-2 sm:border-2 border-ink p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Naya Customer</h2>
          <button onClick={onClose} className="h-10 w-10 grid place-items-center border border-border">
            <X className="h-5 w-5" />
          </button>
        </div>
        <Field label="Naam">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Customer ka naam"
            className="w-full h-12 bg-paper border-2 border-ink px-3 outline-none font-semibold"
            autoFocus
          />
        </Field>
        <Field label="Phone (Pakistan, bina 0)">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="3001234567"
            inputMode="numeric"
            className="w-full h-12 bg-paper border-2 border-ink px-3 outline-none num font-bold"
          />
        </Field>
        <Field label="Default due (din)">
          <input
            value={days}
            onChange={(e) => setDays(e.target.value)}
            inputMode="numeric"
            className="w-full h-12 bg-paper border-2 border-ink px-3 outline-none num font-bold"
          />
        </Field>
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

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">{label}</label>
    {children}
  </div>
);
