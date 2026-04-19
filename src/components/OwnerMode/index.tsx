import { useState } from "react";
import { useUI } from "@/store";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { QuickChips, type ChipKey } from "./QuickChips";
import { SaleCard } from "./SaleCard";
import { UdhaarList } from "./UdhaarList";
import { SupplierList } from "./SupplierList";
import { AlertCards } from "./AlertCards";

export const OwnerMode = () => {
  const setView = useUI((s) => s.setView);
  const [chip, setChip] = useState<ChipKey>("sale");

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-4 py-3 bg-ink text-background border-b-2 border-ink">
        <button
          onClick={() => setView("CHOTA_MODE")}
          className="h-10 px-3 flex items-center gap-2 border border-background/40 text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          Chota Mode
        </button>
        <div className="flex items-center gap-2 font-bold">
          <ShieldCheck className="h-5 w-5" />
          Owner Mode
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {chip === "sale" && <SaleCard />}
        {chip === "udhaar" && <UdhaarList />}
        {chip === "supplier" && <SupplierList />}
        {chip === "alerts" && <AlertCards />}
      </div>

      <QuickChips active={chip} onSelect={setChip} />
    </div>
  );
};
