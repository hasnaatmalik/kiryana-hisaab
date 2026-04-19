import { useUI } from "@/store";

export const Flash = () => {
  const flash = useUI((s) => s.flash);
  if (!flash) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4">
      <div className="animate-flash-in bg-ink text-background px-6 py-3 border-2 border-ink shadow-[4px_4px_0_0_hsl(var(--cash))] num text-lg font-bold">
        {flash}
      </div>
    </div>
  );
};
