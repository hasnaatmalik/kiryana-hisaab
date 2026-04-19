import { useState } from "react";
import { useUI } from "@/store";
import { ShoppingBag, ShieldCheck, ChevronsLeftRight } from "lucide-react";
import { QuickChips, type ChipKey } from "./QuickChips";
import { SaleCard } from "./SaleCard";
import { UdhaarList } from "./UdhaarList";
import { SupplierList } from "./SupplierList";
import { AlertCards } from "./AlertCards";
import { Dashboard } from "./Dashboard";
import { Inventory } from "./Inventory";

export const OwnerMode = () => {
  const requestSwitch = useUI((s) => s.requestSwitch);
  const [chip, setChip] = useState<ChipKey>("dashboard");

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-4 py-3 bg-ink text-background border-b-2 border-ink">
        <div className="flex items-center gap-2 font-bold">
          <ShieldCheck className="h-5 w-5" />
          Owner Mode
        </div>
        <button
          onClick={() => requestSwitch("CHOTA_MODE")}
          className="h-10 px-3 flex items-center gap-2 border border-background/40 text-sm font-semibold active:bg-background/10"
          aria-label="Chota Mode pe jao"
        >
          <ChevronsLeftRight className="h-4 w-4" />
          <ShoppingBag className="h-4 w-4" />
          Chota
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {chip === "dashboard" && <Dashboard />}
        {chip === "sale" && <SaleCard />}
        {chip === "udhaar" && <UdhaarList />}
        {chip === "supplier" && <SupplierList />}
        {chip === "inventory" && <Inventory />}
        {chip === "alerts" && <AlertCards />}
      </div>

      <QuickChips active={chip} onSelect={setChip} />
    </div>
  );
};
