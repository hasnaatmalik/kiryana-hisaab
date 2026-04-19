import { create } from "zustand";

export type View = "PICKER" | "CHOTA_MODE" | "OWNER_MODE";

export interface CartLine {
  itemId: number;
  name: string;
  price: number;
  qty: number;
  emoji: string;
}

const MODE_KEY = "kiryana_mode";
const initialView = (): View => {
  if (typeof localStorage === "undefined") return "PICKER";
  const v = localStorage.getItem(MODE_KEY);
  if (v === "CHOTA_MODE" || v === "OWNER_MODE") return v;
  return "PICKER";
};

interface UIState {
  currentView: View;
  cart: CartLine[];
  flash: string | null;
  pendingSwitchTo: View | null; // for confirm dialog
  setView: (v: View) => void;
  requestSwitch: (v: View) => void;
  confirmSwitch: () => void;
  cancelSwitch: () => void;
  goToPicker: () => void;
  addToCart: (line: Omit<CartLine, "qty">) => void;
  decFromCart: (itemId: number) => void;
  removeFromCart: (itemId: number) => void;
  clearCart: () => void;
  showFlash: (msg: string) => void;
  clearFlash: () => void;
}

export const useUI = create<UIState>((set, get) => ({
  currentView: initialView(),
  cart: [],
  flash: null,
  pendingSwitchTo: null,
  setView: (v) => {
    if (v === "CHOTA_MODE" || v === "OWNER_MODE") {
      localStorage.setItem(MODE_KEY, v);
    } else {
      localStorage.removeItem(MODE_KEY);
    }
    set({ currentView: v });
  },
  requestSwitch: (v) => set({ pendingSwitchTo: v }),
  confirmSwitch: () => {
    const v = get().pendingSwitchTo;
    if (!v) return;
    if (v === "CHOTA_MODE" || v === "OWNER_MODE") {
      localStorage.setItem(MODE_KEY, v);
    }
    set({ currentView: v, pendingSwitchTo: null });
  },
  cancelSwitch: () => set({ pendingSwitchTo: null }),
  goToPicker: () => {
    localStorage.removeItem(MODE_KEY);
    set({ currentView: "PICKER", pendingSwitchTo: null });
  },
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
