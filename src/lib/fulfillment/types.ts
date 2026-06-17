import type { ProductId, PurchaseType } from "@/lib/stripe/products";

export interface FulfillmentLineItem {
  productId: ProductId;
  quantity: number;
  purchaseType: PurchaseType;
}

export interface FulfillmentShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface FulfillmentOrder {
  stripePaymentIntentId: string;
  stripeCustomerId?: string;
  items: FulfillmentLineItem[];
  shipping: FulfillmentShippingAddress;
}
