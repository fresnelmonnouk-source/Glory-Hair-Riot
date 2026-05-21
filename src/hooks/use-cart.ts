'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/stores/cart.store';
import { trpc } from '@/lib/trpc/client';

export function useCart() {
  const store = useCartStore();
  const { data: serverCart } = trpc.cart.list.useQuery();
  const addItemMutation = trpc.cart.addItem.useMutation();

  useEffect(() => {
    if (serverCart) {
      // Sync server cart to local store if user is authenticated
      // This happens on mount/refetch
    }
  }, [serverCart]);

  return {
    items: store.items,
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clear: store.clear,
    getSubtotal: store.getSubtotal,
    getTotal: store.getTotal,
    isLoading: addItemMutation.isPending,
  };
}
