import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface CartItem {
  product_id: string;
  variant_id?: string;
  handle: string;
  quantity: number;
  name: string;
  variant_title?: string;
  sku?: string;
  price: number; // cents
  image?: string;
}

interface CartCtx {
  cart: CartItem[];
  count: number;
  subtotal: number;
  addToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeFromCart: (product_id: string, variant_id?: string) => void;
  updateQty: (product_id: string, variant_id: string | undefined, qty: number) => void;
  clearCart: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
}

const CartContext = createContext<CartCtx | undefined>(undefined);
const KEY = 'gigatron_sports_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem(KEY) || '[]'));
    } catch {
      setCart([]);
    }
  }, []);

  const persist = (next: CartItem[]) => {
    setCart(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>, qty = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (i) => i.product_id === item.product_id && i.variant_id === item.variant_id
      );
      let next: CartItem[];
      if (idx >= 0) {
        next = prev.map((i, n) => (n === idx ? { ...i, quantity: i.quantity + qty } : i));
      } else {
        next = [...prev, { ...item, quantity: qty }];
      }
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
    setDrawerOpen(true);
  }, []);

  const removeFromCart = (product_id: string, variant_id?: string) =>
    persist(cart.filter((i) => !(i.product_id === product_id && i.variant_id === variant_id)));

  const updateQty = (product_id: string, variant_id: string | undefined, qty: number) => {
    if (qty <= 0) return removeFromCart(product_id, variant_id);
    persist(
      cart.map((i) =>
        i.product_id === product_id && i.variant_id === variant_id ? { ...i, quantity: qty } : i
      )
    );
  };

  const clearCart = () => persist([]);

  const count = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, count, subtotal, addToCart, removeFromCart, updateQty, clearCart, drawerOpen, setDrawerOpen }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
