"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getProduct, type ProductId } from "@/lib/stripe/products";
import { CART_STORAGE_KEY, type CartItem } from "@/lib/cart/types";

// Cart persistence uses localStorage until Supabase Auth is integrated.

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isReady: boolean;
  addItem: (productId: ProductId, quantity?: number) => void;
  removeItem: (productId: ProductId) => void;
  updateQuantity: (productId: ProductId, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function parseStoredCart(value: string | null): CartItem[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as CartItem[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.productId === "string" &&
          typeof item.quantity === "number" &&
          item.quantity > 0 &&
          getProduct(item.productId)
      )
      .map((item) => ({
        productId: item.productId,
        quantity: Math.min(99, Math.floor(item.quantity)),
      }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setItems(parseStoredCart(localStorage.getItem(CART_STORAGE_KEY)));
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, isReady]);

  const addItem = useCallback((productId: ProductId, quantity = 1) => {
    if (!getProduct(productId) || quantity < 1) return;

    setItems((current) => {
      const existing = current.find((item) => item.productId === productId);
      if (existing) {
        return current.map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.min(99, item.quantity + quantity) }
            : item
        );
      }
      return [...current, { productId, quantity }];
    });
  }, []);

  const removeItem = useCallback((productId: ProductId) => {
    setItems((current) =>
      current.filter((item) => item.productId !== productId)
    );
  }, []);

  const updateQuantity = useCallback((productId: ProductId, quantity: number) => {
    if (quantity < 1) {
      setItems((current) =>
        current.filter((item) => item.productId !== productId)
      );
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(99, quantity) }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce((total, item) => {
        const product = getProduct(item.productId);
        return total + (product?.price ?? 0) * item.quantity;
      }, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      isReady,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [
      items,
      itemCount,
      subtotal,
      isReady,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
