export type ChipKey = "dashboard" | "sale" | "udhaar" | "supplier" | "inventory" | "alerts";

interface Props {
  active: ChipKey;
  onSelect: (k: ChipKey) => void;
}

const chips: { key: ChipKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "sale", label: "Aaj ki Sale?" },
  { key: "udhaar", label: "Udhaar List" },
  { key: "supplier", label: "Supplier" },
  { key: "inventory", label: "Inventory" },
  { key: "alerts", label: "Koi Masla?" },
];

export const QuickChips = ({ active, onSelect }: Props) => {
  return (
    <div className="border-t-2 border-ink bg-background p-2 overflow-x-auto">
      <div className="flex gap-2 min-w-max">
        {chips.map((c) => {
          const on = active === c.key;
          return (
            <button
              key={c.key}
              onClick={() => onSelect(c.key)}
              className={`h-12 px-4 border-2 border-ink font-semibold text-sm whitespace-nowrap active:translate-y-px ${
                on ? "bg-ink text-background" : "bg-card"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
