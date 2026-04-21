import { ItemGrid } from "./ItemGrid";
import { Cart, CartTotalBar } from "./Cart";
import { CheckoutBar } from "./CheckoutBar";
import { useUI } from "@/store";
import { ShieldCheck, ShoppingBag, ArrowRightLeft } from "lucide-react";

export const ChotaMode = () => {
  const requestSwitch = useUI((s) => s.requestSwitch);
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-4 py-3 bg-ink text-background border-b-2 border-ink">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-background/30 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div>
            <div className="font-black text-base tracking-wide leading-none">Kiryana Hisaab</div>
            <div className="text-[10px] opacity-50 tracking-widest uppercase leading-none mt-0.5">Cashier Mode</div>
          </div>
        </div>
        <button
          onClick={() => requestSwitch("OWNER_MODE")}
          className="h-9 px-4 flex items-center gap-2 rounded-full border border-background/20 bg-background/10 text-sm font-medium hover:bg-background/20 transition-all active:scale-95 shadow-sm"
        >
          <ArrowRightLeft className="h-3.5 w-3.5 opacity-70" />
          <ShieldCheck className="h-4 w-4" />
          Owner
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
