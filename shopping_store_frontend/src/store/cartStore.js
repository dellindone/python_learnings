import { create } from "zustand";

export const useCartStore = create((set) => ({
  cartCount: 0,
  setCartCount: (cartCount) => set({ cartCount }),
}));
