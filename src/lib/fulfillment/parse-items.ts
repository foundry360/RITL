import type { FulfillmentLineItem } from "@/lib/fulfillment/types";
import type { ProductId, PurchaseType } from "@/lib/stripe/products";

const PRODUCT_IDS: ProductId[] = ["focus-coffee", "matcha"];
const PURCHASE_TYPES: PurchaseType[] = ["one-time", "subscription"];

function isProductId(value: string): value is ProductId {
  return PRODUCT_IDS.includes(value as ProductId);
}

function isPurchaseType(value: string): value is PurchaseType {
  return PURCHASE_TYPES.includes(value as PurchaseType);
}

export function parseFulfillmentLineItems(
  rawItems: string | null | undefined
): FulfillmentLineItem[] {
  if (!rawItems) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawItems) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") {
        return [];
      }

      const record = item as Record<string, unknown>;
      const productId = record.productId;
      const quantity = record.quantity;
      const purchaseType = record.purchaseType;

      if (
        typeof productId !== "string" ||
        !isProductId(productId) ||
        typeof quantity !== "number" ||
        quantity <= 0 ||
        typeof purchaseType !== "string" ||
        !isPurchaseType(purchaseType)
      ) {
        return [];
      }

      return [
        {
          productId,
          quantity: Math.min(99, Math.floor(quantity)),
          purchaseType,
        },
      ];
    });
  } catch {
    return [];
  }
}
