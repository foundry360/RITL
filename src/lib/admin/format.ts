export function truncateRoastifyOrderId(orderId: string): string {
  const normalized = orderId.trim();
  if (normalized.length <= 12) {
    return normalized;
  }

  return `${normalized.slice(0, 8)}…${normalized.slice(-4)}`;
}

export type AdminOrderType = "one-time" | "subscription" | "mixed";

export function formatOrderTypeLabel(orderType?: AdminOrderType): string {
  if (orderType === "subscription") {
    return "Subscription";
  }

  if (orderType === "one-time") {
    return "One-time";
  }

  if (orderType === "mixed") {
    return "Mixed";
  }

  return "—";
}
