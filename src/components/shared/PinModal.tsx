import { useUI } from "@/store";
import { X, Delete } from "lucide-react";
import { useEffect } from "react";

export const PinModal = () => {
  const { isPinModalOpen, pinInput, setPin, closePin, setView } = useUI();

  useEffect(() => {
    if (pinInput.length === 4) {
      if (pinInput === "1234") {
        closePin();
        setView("OWNER_MODE");
      } else {
        setPin("");
      }
    }
  }, [pinInput, closePin, setView, setPin]);

  if (!isPinModalOpen) return null;

  const press = (d: string) => {
    if (pinInput.length < 4) setPin(pinInput + d);
  };
  const back = () => setPin(pinInput.slice(0, -1));

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-end sm:items-center justify-center">
      <div className="bg-background w-full sm:max-w-sm border-t-2 sm:border-2 border-ink p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Owner Mode</h2>
          <button onClick={closePin} className="h-10 w-10 grid place-items-center border border-border">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">PIN daalein</p>
        <div className="flex justify-center gap-3 num text-3xl">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 w-12 grid place-items-center border-2 border-ink bg-paper"
            >
              {pinInput[i] ? "•" : ""}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["1","2","3","4","5","6","7","8","9"].map((d) => (
            <button
              key={d}
              onClick={() => press(d)}
              className="h-14 num text-2xl font-bold border-2 border-ink bg-card active:bg-paper"
            >
              {d}
            </button>
          ))}
          <div />
          <button
            onClick={() => press("0")}
            className="h-14 num text-2xl font-bold border-2 border-ink bg-card active:bg-paper"
          >
            0
          </button>
          <button
            onClick={back}
            className="h-14 grid place-items-center border-2 border-ink bg-card active:bg-paper"
          >
            <Delete className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs text-center text-muted-foreground">
          Hint (demo): 1234
        </p>
      </div>
    </div>
  );
};
