"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getProduct,
  type ProductId,
  type PurchaseType,
} from "@/lib/stripe/products";
import { usePricing } from "@/context/PricingContext";
import {
  CART_STORAGE_KEY,
  cartItemKey,
  mergeCartItems,
  normalizePurchaseType,
  type CartItem,
} from "@/lib/cart/types";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isReady: boolean;
  addItem: (
    productId: ProductId,
    quantity?: number,
    purchaseType?: PurchaseType
  ) => void;
  removeItem: (productId: ProductId, purchaseType: PurchaseType) => void;
  updateQuantity: (
    productId: ProductId,
    purchaseType: PurchaseType,
    quantity: number
  ) => void;
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
        purchaseType: normalizePurchaseType(item.purchaseType),
      }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);
  const { getUnitPrice } = usePricing();

  useEffect(() => {
    setItems((current) => {
      const stored = parseStoredCart(localStorage.getItem(CART_STORAGE_KEY));
      return current.length > 0 ? mergeCartItems(stored, current) : stored;
    });
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, isReady]);

  const addItem = useCallback(
    (productId: ProductId, quantity = 1, purchaseType: PurchaseType = "one-time") => {
      if (!getProduct(productId) || quantity < 1) return;

      setItems((current) => {
        const existing = current.find(
          (item) =>
            item.productId === productId && item.purchaseType === purchaseType
        );

        if (existing) {
          return current.map((item) =>
            item.productId === productId && item.purchaseType === purchaseType
              ? { ...item, quantity: Math.min(99, item.quantity + quantity) }
              : item
          );
        }

        return [...current, { productId, quantity, purchaseType }];
      });
    },
    []
  );

  const removeItem = useCallback(
    (productId: ProductId, purchaseType: PurchaseType) => {
      setItems((current) =>
        current.filter(
          (item) =>
            !(
              item.productId === productId && item.purchaseType === purchaseType
            )
        )
      );
    },
    []
  );

  const updateQuantity = useCallback(
    (productId: ProductId, purchaseType: PurchaseType, quantity: number) => {
      if (quantity < 1) {
        setItems((current) =>
          current.filter(
            (item) =>
              !(
                item.productId === productId &&
                item.purchaseType === purchaseType
              )
          )
        );
        return;
      }

      setItems((current) =>
        current.map((item) =>
          item.productId === productId && item.purchaseType === purchaseType
            ? { ...item, quantity: Math.min(99, quantity) }
            : item
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    setItems([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, []);

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce((total, item) => {
        if (!getProduct(item.productId)) return total;
        return (
          total +
          getUnitPrice(item.productId, item.purchaseType) * item.quantity
        );
      }, 0),
    [items, getUnitPrice]
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

export { cartItemKey };
