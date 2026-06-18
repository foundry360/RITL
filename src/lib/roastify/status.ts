const FULFILLMENT_STATUS_RANK: Record<string, number> = {
  created: 1,
  picked: 2,
  printed: 3,
  packaged: 4,
  shipped: 5,
};

export function normalizeFulfillmentStatus(value?: string | null): string | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized || undefined;
}

export function shouldAdvanceFulfillmentStatus(
  current?: string | null,
  incoming?: string | null
): boolean {
  const currentStatus = normalizeFulfillmentStatus(current);
  const incomingStatus = normalizeFulfillmentStatus(incoming);

  if (!incomingStatus) {
    return false;
  }

  if (incomingStatus === "canceled") {
    return currentStatus !== "canceled";
  }

  if (!currentStatus || currentStatus === "canceled") {
    return true;
  }

  if (currentStatus === "shipped") {
    return false;
  }

  const currentRank = FULFILLMENT_STATUS_RANK[currentStatus] ?? 0;
  const incomingRank = FULFILLMENT_STATUS_RANK[incomingStatus] ?? 0;

  return incomingRank > currentRank;
}

export function resolveForwardFulfillmentStatus(
  current?: string | null,
  incoming?: string | null
): string | undefined {
  const currentStatus = normalizeFulfillmentStatus(current);
  const incomingStatus = normalizeFulfillmentStatus(incoming);

  if (!incomingStatus) {
    return currentStatus;
  }

  if (shouldAdvanceFulfillmentStatus(currentStatus, incomingStatus)) {
    return incomingStatus;
  }

  return currentStatus;
}
