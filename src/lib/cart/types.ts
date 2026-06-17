import type { ProductId } from "@/lib/stripe/products";

export interface CartItem {
  productId: ProductId;
  quantity: number;
}

export const CART_STORAGE_KEY = "ritl-cart";
