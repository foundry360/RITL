import type { FulfillmentOrder } from "@/lib/fulfillment/types";
import {
  getRoastifyArtworkUrl,
  getRoastifySku,
} from "@/lib/roastify/catalog";
import type {
  RoastifyCreateOrderRequest,
  RoastifyOrderItem,
} from "@/lib/roastify/types";

export function buildRoastifyOrder(
  fulfillmentOrder: FulfillmentOrder
): RoastifyCreateOrderRequest {
  const email = fulfillmentOrder.shipping.email?.trim();
  if (!email) {
    throw new Error("Customer email is required for Roastify fulfillment");
  }

  const items = fulfillmentOrder.items.flatMap<RoastifyOrderItem>((item) => {
    const sku = getRoastifySku(item.productId);
    if (!sku) {
      throw new Error(`Missing Roastify SKU for product: ${item.productId}`);
    }

    const artworkUrl = getRoastifyArtworkUrl(item.productId);

    return [
      {
        sku,
        quantity: item.quantity,
        ...(artworkUrl ? { artworkUrl } : {}),
      },
    ];
  });

  if (!items.length) {
    throw new Error("No fulfillable items found for Roastify order");
  }

  return {
    toAddress: {
      name: fulfillmentOrder.shipping.name,
      street1: fulfillmentOrder.shipping.line1,
      ...(fulfillmentOrder.shipping.line2
        ? { street2: fulfillmentOrder.shipping.line2 }
        : {}),
      city: fulfillmentOrder.shipping.city,
      state: fulfillmentOrder.shipping.state,
      zip: fulfillmentOrder.shipping.postalCode,
      country: fulfillmentOrder.shipping.country,
      email,
      ...(fulfillmentOrder.shipping.phone
        ? { phone: fulfillmentOrder.shipping.phone }
        : {}),
    },
    items,
  };
}
