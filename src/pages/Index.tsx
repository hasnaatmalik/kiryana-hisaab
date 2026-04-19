import { useEffect, useState } from "react";
import { useUI } from "@/store";
import { ChotaMode } from "@/components/ChotaMode";
import { OwnerMode } from "@/components/OwnerMode";
import { PinModal } from "@/components/shared/PinModal";
import { Flash } from "@/components/shared/Flash";
import { seedIfEmpty } from "@/seed";

const Index = () => {
  const view = useUI((s) => s.currentView);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.title = "Kiryana OS — Hisaab Asaan";
    seedIfEmpty().finally(() => setReady(true));
  }, []);

  return (
    <main className="min-h-dvh flex justify-center bg-background">
      <div className="w-full max-w-md h-dvh flex flex-col bg-background border-x border-border">
        <h1 className="sr-only">Kiryana OS — Smart Kiryana &amp; Supplier Assistant</h1>
        {!ready ? (
          <div className="flex-1 grid place-items-center text-muted-foreground">
            Loading…
          </div>
        ) : view === "CHOTA_MODE" ? (
          <ChotaMode />
        ) : (
          <OwnerMode />
        )}
        <PinModal />
        <Flash />
      </div>
    </main>
  );
};

export default Index;
