import { create } from "zustand";

export type View = "CHOTA_MODE" | "OWNER_MODE";

export interface CartLine {
  itemId: number;
  name: string;
  price: number;
  qty: number;
  emoji: string;
}

interface UIState {
  currentView: View;
  cart: CartLine[];
  isPinModalOpen: boolean;
  pinInput: string;
  flash: string | null;
  setView: (v: View) => void;
  addToCart: (line: Omit<CartLine, "qty">) => void;
  decFromCart: (itemId: number) => void;
  removeFromCart: (itemId: number) => void;
  clearCart: () => void;
  openPin: () => void;
  closePin: () => void;
  setPin: (p: string) => void;
  showFlash: (msg: string) => void;
  clearFlash: () => void;
}

export const useUI = create<UIState>((set, get) => ({
  currentView: "CHOTA_MODE",
  cart: [],
  isPinModalOpen: false,
  pinInput: "",
  flash: null,
  setView: (v) => set({ currentView: v }),
  addToCart: (line) => {
    const cart = [...get().cart];
    const i = cart.findIndex((c) => c.itemId === line.itemId);
    if (i >= 0) cart[i] = { ...cart[i], qty: cart[i].qty + 1 };
    else cart.push({ ...line, qty: 1 });
    set({ cart });
  },
  decFromCart: (itemId) => {
    const cart = get().cart
      .map((c) => (c.itemId === itemId ? { ...c, qty: c.qty - 1 } : c))
      .filter((c) => c.qty > 0);
    set({ cart });
  },
  removeFromCart: (itemId) =>
    set({ cart: get().cart.filter((c) => c.itemId !== itemId) }),
  clearCart: () => set({ cart: [] }),
  openPin: () => set({ isPinModalOpen: true, pinInput: "" }),
  closePin: () => set({ isPinModalOpen: false, pinInput: "" }),
  setPin: (p) => set({ pinInput: p }),
  showFlash: (msg) => {
    set({ flash: msg });
    setTimeout(() => {
      if (get().flash === msg) set({ flash: null });
    }, 1600);
  },
  clearFlash: () => set({ flash: null }),
}));

export const cartTotal = (cart: CartLine[]) =>
  cart.reduce((s, c) => s + c.price * c.qty, 0);
