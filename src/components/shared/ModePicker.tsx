import { useUI } from "@/store";
import { Store, ShieldCheck } from "lucide-react";

export const ModePicker = () => {
  const setView = useUI((s) => s.setView);

  return (
    <div className="flex flex-col h-full">
      <header className="px-4 py-4 bg-ink text-background border-b-2 border-ink text-center">
        <div className="flex items-center justify-center gap-2 font-bold tracking-wide">
          <Store className="h-5 w-5" />
          Kiryana OS
        </div>
        <p className="text-xs opacity-80 mt-1">Hisaab Asaan</p>
      </header>

      <div className="flex-1 flex flex-col p-4 gap-4 justify-center">
        <p className="text-center text-sm text-muted-foreground uppercase tracking-wider">
          Kaun istemaal kar raha hai?
        </p>

        <button
          onClick={() => setView("CHOTA_MODE")}
          className="bg-card border-2 border-ink p-6 flex flex-col items-center gap-3 active:translate-y-px active:bg-paper"
        >
          <div className="h-20 w-20 grid place-items-center bg-paper border-2 border-ink text-5xl">
            🧒
          </div>
          <div className="text-center">
            <div className="font-black text-2xl">Chota Mode</div>
            <p className="text-sm text-muted-foreground mt-1">
              Helper boy — sirf sale aur udhaar entry
            </p>
          </div>
        </button>

        <button
          onClick={() => setView("OWNER_MODE")}
          className="bg-ink text-background border-2 border-ink p-6 flex flex-col items-center gap-3 active:translate-y-px"
        >
          <div className="h-20 w-20 grid place-items-center bg-background text-ink border-2 border-background text-4xl">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <div className="text-center">
            <div className="font-black text-2xl">Owner Mode</div>
            <p className="text-sm opacity-80 mt-1">
              Malik — poora hisaab, dashboard, inventory
            </p>
          </div>
        </button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Mode kabhi bhi switch ho sakta hai header se.
        </p>
      </div>
    </div>
  );
};
