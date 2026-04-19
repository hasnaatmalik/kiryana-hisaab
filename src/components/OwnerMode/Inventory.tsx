import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Item } from "@/db";
import { rs } from "@/lib/format";
import { useUI } from "@/store";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { AddItemModal } from "@/components/shared/AddItemModal";

export const Inventory = () => {
  const items = useLiveQuery(() => db.items.orderBy("name").toArray(), []);
  const [editing, setEditing] = useState<Item | null>(null);
  const [adding, setAdding] = useState(false);
  const showFlash = useUI((s) => s.showFlash);

  const remove = async (item: Item) => {
    if (!confirm(`"${item.name}" delete karein?`)) return;
    await db.items.delete(item.id!);
    showFlash("Item hat gaya!");
  };

  if (!items) return <div className="h-40 bg-muted animate-pulse border border-border" />;

  return (
    <div className="space-y-3">
      <div className="bg-card border-2 border-ink">
        <div className="px-4 py-3 border-b-2 border-ink flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <h3 className="font-bold uppercase tracking-wide">Inventory</h3>
          </div>
          <span className="num text-sm text-muted-foreground">{items.length} items</span>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="w-full h-14 flex items-center justify-center gap-2 bg-ink text-background border-b-2 border-ink font-semibold active:translate-y-px"
        >
          <Plus className="h-5 w-5" />
          Naya Item Add Karein
        </button>

        {items.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">Koi item nahi.</div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((it) => (
              <li key={it.id} className="px-3 py-3 flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 border-2 border-ink bg-paper grid place-items-center overflow-hidden">
                  {it.image_url ? (
                    <img src={it.image_url} alt={it.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl">{it.emoji}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{it.name}</div>
                  {it.description && (
                    <div className="text-xs text-muted-foreground truncate">{it.description}</div>
                  )}
                  <div className="num text-sm font-bold">{rs(it.price)}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => setEditing(it)}
                    className="h-9 w-9 grid place-items-center border-2 border-ink bg-card active:translate-y-px"
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(it)}
                    className="h-9 w-9 grid place-items-center border-2 border-ink bg-udhaar text-udhaar-foreground active:translate-y-px"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {(adding || editing) && (
        <AddItemModal initial={editing} onClose={() => { setAdding(false); setEditing(null); }} />
      )}
    </div>
  );
};
