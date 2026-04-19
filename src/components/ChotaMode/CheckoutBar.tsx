import { useState } from "react";
import { useUI, cartTotal } from "@/store";
import { db, todayISO } from "@/db";
import { CustomerSelectModal } from "@/components/shared/CustomerSelectModal";
import { Banknote, NotebookPen } from "lucide-react";

export const CheckoutBar = () => {
  const { cart, clearCart, showFlash } = useUI();
  const total = cartTotal(cart);
  const disabled = total === 0;
  const [pickerOpen, setPickerOpen] = useState(false);

  const onCash = async () => {
    if (disabled) return;
    await db.transactions.add({
      type: "cash_sale",
      amount: total,
      date: todayISO(),
      description: cart.map((c) => `${c.qty}× ${c.name}`).join(", "),
    });
    clearCart();
    showFlash("Hisaab ho gaya!");
  };

  const onUdhaarPick = async (customerId: number, name: string) => {
    await db.transaction("rw", db.customers, db.transactions, async () => {
      const c = await db.customers.get(customerId);
      if (!c) return;
      await db.customers.update(customerId, { balance: c.balance + total });
      await db.transactions.add({
        type: "udhaar_given",
        amount: total,
        related_id: customerId,
        date: todayISO(),
        description: `${name} — ${cart.map((c) => `${c.qty}× ${c.name}`).join(", ")}`,
      });
    });
    clearCart();
    setPickerOpen(false);
    showFlash("Udhaar chadh gaya!");
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2 p-3 bg-background border-t-2 border-ink">
        <button
          onClick={onCash}
          disabled={disabled}
          className="h-16 bg-cash text-cash-foreground border-2 border-ink font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-40 active:translate-y-px"
        >
          <Banknote className="h-5 w-5" />
          CASH
        </button>
        <button
          onClick={() => !disabled && setPickerOpen(true)}
          disabled={disabled}
          className="h-16 bg-udhaar text-udhaar-foreground border-2 border-ink font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-40 active:translate-y-px"
        >
          <NotebookPen className="h-5 w-5" />
          UDHAAR
        </button>
      </div>
      <CustomerSelectModal
        open={pickerOpen}
        total={total}
        onClose={() => setPickerOpen(false)}
        onPick={onUdhaarPick}
      />
    </>
  );
};
