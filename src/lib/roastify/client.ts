import {
  getRoastifyApiBaseUrl,
  getRoastifyApiKey,
} from "@/lib/roastify/config";
import type {
  RoastifyCreateOrderRequest,
  RoastifyCreateOrderResponse,
} from "@/lib/roastify/types";

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
