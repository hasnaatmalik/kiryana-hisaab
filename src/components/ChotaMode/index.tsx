import { ItemGrid } from "./ItemGrid";
import { Cart, CartTotalBar } from "./Cart";
import { CheckoutBar } from "./CheckoutBar";
import { useUI } from "@/store";
import { ShieldCheck, Store, ChevronsLeftRight } from "lucide-react";

export const ChotaMode = () => {
  const requestSwitch = useUI((s) => s.requestSwitch);
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-4 py-3 bg-ink text-background border-b-2 border-ink">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          <h1 className="font-bold tracking-wide">Kiryana OS</h1>
        </div>
        <button
          onClick={() => requestSwitch("OWNER_MODE")}
          className="h-10 px-3 flex items-center gap-2 border border-background/40 text-sm font-semibold active:bg-background/10"
        >
          <ChevronsLeftRight className="h-4 w-4" />
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
