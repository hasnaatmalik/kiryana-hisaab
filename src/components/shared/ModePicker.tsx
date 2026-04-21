import { useUI } from "@/store";
import { ShoppingBag, ShieldCheck } from "lucide-react";

export const ModePicker = () => {
  const setView = useUI((s) => s.setView);

  return (
    <div className="flex flex-col h-full bg-paper">
      {/* Header branding */}
      <div className="px-6 pt-12 pb-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-ink text-background border-2 border-ink mb-4">
          <ShoppingBag className="h-8 w-8" strokeWidth={2} />
        </div>
        <h1 className="font-black text-2xl uppercase tracking-widest text-ink">Kiryana Hisaab</h1>
        <p className="urdu text-base text-muted-foreground mt-1">آپ کا ڈیجیٹل کھاتہ</p>
        <div className="mt-5 h-px bg-ink" />
      </div>

      {/* Mode selection */}
      <div className="flex-1 flex flex-col justify-center px-6 gap-4 pb-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground text-center mb-2">
          کون ہیں آپ؟
        </p>

        {/* Chota / Cashier */}
        <button
          id="mode-chota"
          onClick={() => setView("CHOTA_MODE")}
          className="group relative bg-background border-2 border-ink p-5 text-left active:translate-y-px transition-transform overflow-hidden"
        >
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 border-2 border-ink flex items-center justify-center bg-paper">
              <ShoppingBag className="h-6 w-6" strokeWidth={2} />
            </div>
            <div>
              <div className="font-black text-xl uppercase tracking-tight text-ink">Chota / Cashier</div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Sirf sale karo — cash ya udhaar
              </p>
            </div>
            <div className="ml-auto text-muted-foreground opacity-40 group-active:opacity-70 text-2xl font-thin">›</div>
          </div>
        </button>

        {/* Owner */}
        <button
          id="mode-owner"
          onClick={() => setView("OWNER_MODE")}
          className="group relative bg-ink text-background border-2 border-ink p-5 text-left active:translate-y-px transition-transform overflow-hidden"
        >
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 border-2 border-background/30 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6" strokeWidth={2} />
            </div>
            <div>
              <div className="font-black text-xl uppercase tracking-tight">Maalik / Owner</div>
              <p className="text-sm opacity-70 mt-0.5">
                Poora hisaab — ledger, udhaar, supplier
              </p>
            </div>
            <div className="ml-auto opacity-40 group-active:opacity-70 text-2xl font-thin">›</div>
          </div>
        </button>

        <p className="text-center text-[10px] text-muted-foreground mt-4 uppercase tracking-wider">
          Mode anytime switch ho sakta hai — top button se
        </p>
      </div>
    </div>
  );
};
