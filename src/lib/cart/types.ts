import type { ProductId, PurchaseType } from "@/lib/stripe/products";

export type { PurchaseType };

export interface CartItem {
  productId: ProductId;
  quantity: number;
  purchaseType: PurchaseType;
}

export const CART_STORAGE_KEY = "ritl-cart";

export function cartItemKey(item: Pick<CartItem, "productId" | "purchaseType">) {
  return `${item.productId}:${item.purchaseType}`;
}

export function normalizePurchaseType(value: unknown): PurchaseType {
  return value === "subscription" ? "subscription" : "one-time";
}

export function mergeCartItems(...groups: CartItem[][]): CartItem[] {
  const merged = new Map<string, CartItem>();

  for (const group of groups) {
    for (const item of group) {
      const key = cartItemKey(item);
      const existing = merged.get(key);

      if (existing) {
        merged.set(key, {
          ...existing,
          quantity: Math.min(99, existing.quantity + item.quantity),
        });
        continue;
      }

      merged.set(key, item);
    }
  }

  return Array.from(merged.values());
}
