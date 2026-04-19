import { ItemGrid } from "./ItemGrid";
import { Cart, CartTotalBar } from "./Cart";
import { CheckoutBar } from "./CheckoutBar";
import { useUI } from "@/store";
import { Lock, Store } from "lucide-react";

export const ChotaMode = () => {
  const openPin = useUI((s) => s.openPin);
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-4 py-3 bg-ink text-background border-b-2 border-ink">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          <h1 className="font-bold tracking-wide">Kiryana OS</h1>
        </div>
        <button
          onClick={openPin}
          className="h-10 px-3 flex items-center gap-2 border border-background/40 text-sm font-semibold active:bg-background/10"
        >
          <Lock className="h-4 w-4" />
          Owner Mode
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <ItemGrid />
      </div>

      <Cart />
      <CartTotalBar />
      <CheckoutBar />
    </div>
  );
};
