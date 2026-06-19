import type { ProductId, PurchaseType } from "@/lib/stripe/products";

export interface AbandonedCheckoutItem {
  productId: ProductId;
  quantity: number;
  purchaseType: PurchaseType;
}

export interface AbandonedCheckoutRecord {
  id: string;
  email: string;
  checkoutReference: string | null;
  items: AbandonedCheckoutItem[];
  amountCents: number;
  currency: string;
  lastActivityAt: string;
  reminderSentAt: string | null;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecordAbandonedCheckoutInput {
  email: string;
  checkoutReference?: string;
  items: AbandonedCheckoutItem[];
  amountCents: number;
  currency?: string;
}
