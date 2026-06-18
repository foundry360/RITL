import type {
  RoastifyOrderDetail,
  RoastifyOrderTracking,
} from "@/lib/roastify/types";

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function getRoastifyOrderStatus(order: RoastifyOrderDetail): string | undefined {
  return readString(order.orderStatus) ?? readString(order.status);
}

export function getRoastifyOrderTracking(
  order: RoastifyOrderDetail
): RoastifyOrderTracking {
  const shippingLabel = order.shippingLabel;

  const trackingNumber =
    readString(order.trackingNumber) ??
    readString(shippingLabel?.trackingNumber);

  const trackingUrl =
    readString(order.trackingUrl) ??
    readString(shippingLabel?.trackingUrl);

  const carrier =
    readString(order.carrier) ??
    readString(shippingLabel?.carrier);

  const trackingStatus = readString(shippingLabel?.status);

  return {
    trackingNumber,
    trackingUrl,
    carrier,
    trackingStatus,
  };
}

export function buildRoastifyItemsSummary(order: RoastifyOrderDetail): string | undefined {
  if (!order.items?.length) {
    return undefined;
  }

  return order.items
    .map((item) => {
      const sku = readString(item.sku) ?? "Item";
      const quantity =
        typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1;
      return `${sku} × ${quantity}`;
    })
    .join(", ");
}
