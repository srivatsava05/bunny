import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const LS_KEY = user ? `craftify_cart_${user.name}` : 'craftify_cart_guest';

  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const newItems = (() => {
      try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    })();
    setItems(newItems);
  }, [LS_KEY]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(items));
    } catch {}
  }, [items, LS_KEY]);

  const add = (product, qty = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.product._id === product._id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty };
        return copy;
      }
      return [...prev, { product, qty }];
    });
  };

  const remove = (id) => setItems((prev) => prev.filter((it) => it.product._id !== id));

  const updateQty = (id, qty) =>
    setItems((prev) =>
      prev.map((it) => (it.product._id === id ? { ...it, qty: Math.max(1, qty) } : it))
    );

  const clear = () => setItems([]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + it.product.price * it.qty, 0);
    const count = items.reduce((s, it) => s + it.qty, 0);
    return { subtotal, count };
  }, [items]);

  return (
    <CartContext.Provider value={{ items, add, remove, updateQty, clear, totals }}>
      {children}
    </CartContext.Provider>
  );
}
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
