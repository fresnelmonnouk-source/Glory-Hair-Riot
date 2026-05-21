'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  wig_id: string;
  variant_id: string | null;
  quantity: number;
  price_at_added: number;
  name?: string;
  image_url?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  getTotal: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find(
            (i) =>
              i.wig_id === item.wig_id && i.variant_id === item.variant_id
          );

          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === existingItem.id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                ...item,
                id: `${item.wig_id}-${item.variant_id || 'default'}`,
              },
            ],
          };
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        })),

      clear: () => set({ items: [] }),

      getSubtotal: () => {
        const { items } = get();
        return items.reduce((sum, item) => sum + item.price_at_added * item.quantity, 0);
      },

      getTotal: () => {
        const { items } = get();
        const subtotal = items.reduce(
          (sum, item) => sum + item.price_at_added * item.quantity,
          0
        );
        const shipping = subtotal > 15000 ? 0 : 990;
        return subtotal + shipping;
      },
    }),
    {
      name: 'glory-hair-cart',
    }
  )
);
