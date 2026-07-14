"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  variantId?: string;
  // display snapshots (server re-validates prices at checkout)
  name: string;
  variantName?: string;
  slug: string;
  unitPrice: number; // IQD
  image?: string;
  maxStock: number;
  quantity: number;
}

const keyOf = (productId: string, variantId?: string) =>
  `${productId}::${variantId ?? ""}`;

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  remove: (productId: string, variantId?: string) => void;
  setQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item, quantity = 1) =>
        set((state) => {
          const key = keyOf(item.productId, item.variantId);
          const existing = state.items.find((i) => keyOf(i.productId, i.variantId) === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                keyOf(i.productId, i.variantId) === key
                  ? { ...i, quantity: Math.min(i.quantity + quantity, i.maxStock, 99) }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: Math.min(quantity, item.maxStock, 99) }],
          };
        }),
      remove: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (i) => keyOf(i.productId, i.variantId) !== keyOf(productId, variantId)
          ),
        })),
      setQuantity: (productId, variantId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter(
                  (i) => keyOf(i.productId, i.variantId) !== keyOf(productId, variantId)
                )
              : state.items.map((i) =>
                  keyOf(i.productId, i.variantId) === keyOf(productId, variantId)
                    ? { ...i, quantity: Math.min(quantity, i.maxStock, 99) }
                    : i
                ),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "cart" }
  )
);

export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

export const cartCount = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.quantity, 0);
