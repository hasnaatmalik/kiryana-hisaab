import { useUI } from "@/store";

export const SwitchModeDialog = () => {
  const { pendingSwitchTo, confirmSwitch, cancelSwitch } = useUI();
  if (!pendingSwitchTo) return null;
  const label =
    pendingSwitchTo === "CHOTA_MODE" ? "Chota Mode"
    : pendingSwitchTo === "OWNER_MODE" ? "Owner Mode"
    : "Mode Picker";

  return (
    <div className="fixed inset-0 z-[60] bg-ink/40 flex items-end sm:items-center justify-center">
      <div className="bg-background w-full sm:max-w-sm border-t-2 sm:border-2 border-ink p-5 space-y-4">
        <div>
          <h2 className="font-bold text-lg">Mode badlein?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Aap <span className="font-semibold text-ink">{label}</span> mein jaa rahe hain.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={cancelSwitch}
            className="h-12 border-2 border-ink bg-paper font-semibold active:translate-y-px"
          >
            Nahi
          </button>
          <button
            onClick={confirmSwitch}
            className="h-12 border-2 border-ink bg-ink text-background font-semibold active:translate-y-px"
          >
            Haan, badlein
          </button>
        </div>
      </div>
    </div>
  );
};
