import { useUI, cartTotal } from "@/store";
import { Minus, Plus, Trash2 } from "lucide-react";
import { rs } from "@/lib/format";

export const Cart = () => {
  const { cart, addToCart, decFromCart, removeFromCart } = useUI();

  if (cart.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-muted-foreground text-sm border-t-2 border-ink bg-paper">
        Koi item add karein — niche cart yahan banegi
      </div>
    );
  }

  return (
    <div className="border-t-2 border-ink bg-paper">
      <div className="max-h-[28vh] overflow-y-auto divide-y divide-border">
        {cart.map((c) => (
          <div key={c.itemId} className="flex items-center gap-2 px-3 py-2">
            <span className="text-2xl">{c.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{c.name}</div>
              <div className="num text-xs text-muted-foreground">
                {c.qty} × Rs. {c.price}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => decFromCart(c.itemId)}
                className="h-9 w-9 grid place-items-center border border-ink bg-card"
                aria-label="minus"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="num w-6 text-center font-bold">{c.qty}</span>
              <button
                onClick={() =>
                  addToCart({ itemId: c.itemId, name: c.name, price: c.price, emoji: c.emoji })
                }
                className="h-9 w-9 grid place-items-center border border-ink bg-card"
                aria-label="plus"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => removeFromCart(c.itemId)}
                className="h-9 w-9 grid place-items-center border border-ink bg-card text-udhaar ml-1"
                aria-label="remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="num font-bold w-20 text-right">
              {rs(c.price * c.qty)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CartTotalBar = () => {
  const cart = useUI((s) => s.cart);
  const total = cartTotal(cart);
  return (
    <div className="flex items-baseline justify-between px-4 py-3 bg-card border-t-2 border-ink">
      <span className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Total</span>
      <span className="num text-3xl font-black">{rs(total)}</span>
    </div>
  );
};
