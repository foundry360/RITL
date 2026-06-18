import {
  getRoastifyApiBaseUrl,
  getRoastifyApiKey,
} from "@/lib/roastify/config";
import type {
  RoastifyCreateOrderRequest,
  RoastifyCreateOrderResponse,
  RoastifyOrderDetail,
  RoastifyOrdersListResponse,
} from "@/lib/roastify/types";

function getRoastifyHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-api-key": getRoastifyApiKey(),
  };
}

function parseRoastifyError(data: unknown, status: number, fallback: string): string {
  const record = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const errors = Array.isArray(record.errors) ? record.errors : [];
  const errorMessages = errors
    .map((entry) =>
      entry && typeof entry === "object"
        ? (entry as { message?: string }).message
        : undefined
    )
    .filter((message): message is string => Boolean(message));

  if (errorMessages.length > 0) {
    return errorMessages.join("; ");
  }

  if (typeof record.message === "string") {
    return record.message;
  }

  if (typeof record.error === "string") {
    return record.error;
  }

  return `${fallback} (${status})`;
}

export async function createRoastifyOrder(
  order: RoastifyCreateOrderRequest,
  idempotencyKey: string
): Promise<RoastifyCreateOrderResponse> {
  const response = await fetch(`${getRoastifyApiBaseUrl()}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getRoastifyApiKey(),
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(order),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errors = Array.isArray(data?.errors) ? data.errors : [];
    const errorMessages = errors
      .map((entry: { message?: string }) => entry.message)
      .filter((message: string | undefined): message is string => Boolean(message));

    const message =
      errorMessages.length > 0
        ? errorMessages.join("; ")
        : typeof data?.message === "string"
          ? data.message
          : typeof data?.error === "string"
            ? data.error
            : `Roastify order request failed (${response.status})`;
    throw new Error(message);
  }

  if (!data?.orderId || typeof data.orderId !== "string") {
    throw new Error("Roastify order response did not include an orderId");
  }

  return data as RoastifyCreateOrderResponse;
}

export async function getRoastifyOrder(
  orderId: string
): Promise<RoastifyOrderDetail> {
  const response = await fetch(`${getRoastifyApiBaseUrl()}/orders/${orderId}`, {
    headers: getRoastifyHeaders(),
    next: { revalidate: 0 },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      parseRoastifyError(data, response.status, "Roastify order lookup failed")
    );
  }

  if (!data?.orderId || typeof data.orderId !== "string") {
    throw new Error("Roastify order response did not include an orderId");
  }

  return data as RoastifyOrderDetail;
}

export async function listRoastifyOrders(options?: {
  pageSize?: number;
  maxPages?: number;
}): Promise<RoastifyOrderDetail[]> {
  const pageSize = options?.pageSize ?? 50;
  const maxPages = options?.maxPages ?? 5;
  const orders: RoastifyOrderDetail[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < maxPages; page += 1) {
    const url = new URL(`${getRoastifyApiBaseUrl()}/orders`);
    url.searchParams.set("pageSize", String(pageSize));
    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }

    const response = await fetch(url, {
      headers: getRoastifyHeaders(),
      next: { revalidate: 0 },
    });

    const data = (await response.json().catch(() => ({}))) as RoastifyOrdersListResponse;

    if (!response.ok) {
      throw new Error(
        parseRoastifyError(data, response.status, "Roastify orders list failed")
      );
    }

    orders.push(...(data.orders ?? []));

    if (!data.pageInfo?.hasNextPage || !data.pageInfo.endCursor) {
      break;
    }

    cursor = data.pageInfo.endCursor;
  }

  return orders;
}
