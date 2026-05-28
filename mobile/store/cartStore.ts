import { create } from "zustand";
import { Cart } from "@/types";
import { cartApi } from "@/lib/api";
import { parseCartPayload } from "@/lib/cartResponse";

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  isOpen: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  itemCount: () => number;
  resetCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,
  isOpen: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const { data } = await cartApi.get();
      set({ cart: parseCartPayload(data), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (productId, quantity = 1) => {
    set({ isLoading: true });
    try {
      const { data } = await cartApi.add(productId, quantity);
      const cart = parseCartPayload(data);
      if (!cart) throw new Error("Invalid cart response");
      set({ cart, isLoading: false, isOpen: true });
    } catch (err: unknown) {
      set({ isLoading: false });
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to add item";
      throw new Error(msg);
    }
  },

  updateItem: async (itemId, quantity) => {
    set({ isLoading: true });
    try {
      const { data } = await cartApi.update(itemId, quantity);
      set({ cart: parseCartPayload(data), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  removeItem: async (itemId) => {
    set({ isLoading: true });
    try {
      const { data } = await cartApi.remove(itemId);
      set({ cart: parseCartPayload(data), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  clearCart: async () => {
    set({ isLoading: true });
    try {
      await cartApi.clear();
      set({ cart: null, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  resetCart: () => set({ cart: null, isLoading: false, isOpen: false }),

  itemCount: () => {
    const { cart } = get();
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
