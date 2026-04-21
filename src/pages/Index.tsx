import { useEffect, useState } from "react";
import { useUI } from "@/store";
import { ChotaMode } from "@/components/ChotaMode";
import { OwnerMode } from "@/components/OwnerMode";
import { ModePicker } from "@/components/shared/ModePicker";
import { SwitchModeDialog } from "@/components/shared/SwitchModeDialog";
import { Flash } from "@/components/shared/Flash";
import { seedIfEmpty } from "@/seed";
import { pullAllFromCloud } from "@/lib/sync";

const Index = () => {
  const view = useUI((s) => s.currentView);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.title = "Kiryana Hisaab";
    seedIfEmpty().then(() => {
      // Background pull from cloud to keep all data in sync across devices
      pullAllFromCloud().finally(() => setReady(true));
    });
  }, []);

  return (
    <main className="min-h-dvh flex justify-center bg-background">
      <div className="w-full max-w-md h-dvh flex flex-col bg-background border-x border-border">
        <h1 className="sr-only">Kiryana Hisaab — Smart Kiryana &amp; Supplier Assistant</h1>
        {!ready ? (
          <div className="flex-1 grid place-items-center text-muted-foreground">
            Loading…
          </div>
        ) : view === "PICKER" ? (
          <ModePicker />
        ) : view === "CHOTA_MODE" ? (
          <ChotaMode />
        ) : (
          <OwnerMode />
        )}
        <SwitchModeDialog />
        <Flash />
      </div>
    </main>
  );
};

export default Index;
