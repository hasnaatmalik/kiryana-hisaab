import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { useUI } from "@/store";

export const ItemGrid = () => {
  const items = useLiveQuery(() => db.items.toArray(), []);
  const addToCart = useUI((s) => s.addToCart);

  if (!items) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square bg-muted animate-pulse border border-border" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        Koi item nahi. Owner Mode → Inventory se add karein.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-3">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() =>
            addToCart({ itemId: it.id!, name: it.name, price: it.price, emoji: it.emoji })
          }
          className="aspect-square bg-card border-2 border-ink p-2 flex flex-col items-center justify-between active:bg-paper active:translate-y-px overflow-hidden"
        >
          {it.image_url ? (
            <img
              src={it.image_url}
              alt={it.name}
              className="flex-1 w-full object-cover border border-border min-h-0"
            />
          ) : (
            <span className="text-3xl sm:text-4xl">{it.emoji}</span>
          )}
          <div className="text-center w-full mt-1">
            <div className="text-sm font-semibold leading-tight truncate">{it.name}</div>
            <div className="num text-xs font-bold text-muted-foreground">Rs. {it.price}</div>
          </div>
        </button>
      ))}
    </div>
  );
};
