import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { useUI } from "@/store";

export const ItemGrid = () => {
  const items = useLiveQuery(() => db.items.toArray(), []);
  const addToCart = useUI((s) => s.addToCart);
  const [search, setSearch] = useState("");

  if (!items) {
    return (
      <div className="grid grid-cols-3 gap-2 p-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="aspect-square bg-muted animate-pulse border border-border" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4 gap-2">
        <div className="text-4xl">🛒</div>
        <p className="text-sm text-muted-foreground">
          Koi item nahi. Owner Mode → Inventory se add karein.
        </p>
      </div>
    );
  }

  const filtered = search
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="px-3 pt-3 pb-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Item ya category dhundein..."
          className="w-full h-10 px-3 bg-paper border-2 border-ink text-sm outline-none placeholder:text-muted-foreground font-medium"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2 px-3 pb-3">
        {filtered.map((it) => (
          <button
            key={it.id}
            id={`item-${it.id}`}
            onClick={() => addToCart({ itemId: it.id!, name: it.name, price: it.price, emoji: it.emoji })}
            className="bg-card border-2 border-ink flex flex-col overflow-hidden active:bg-paper active:translate-y-px transition-transform"
          >
            {/* Image area */}
            <div className="w-full aspect-square bg-muted overflow-hidden flex items-center justify-center border-b border-border">
              {it.image_url ? (
                <img
                  src={it.image_url}
                  alt={it.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="text-4xl">{it.emoji}</span>
              )}
            </div>
            {/* Label */}
            <div className="p-1.5 text-center">
              <div className="text-[11px] font-bold leading-tight line-clamp-2">{it.name}</div>
              <div className="num text-[11px] font-black text-cash mt-0.5">Rs.{it.price}</div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 py-8 text-center text-muted-foreground text-sm">
            "{search}" nahi mila
          </div>
        )}
      </div>
    </div>
  );
};

