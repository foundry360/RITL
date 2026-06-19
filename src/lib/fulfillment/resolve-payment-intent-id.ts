import type { NextRequest } from "next/server";

async function readPaymentIntentIdFromBody(
  request: NextRequest
): Promise<string | undefined> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined;
  }

  const text = await request.text();
  if (!text.trim()) {
    return undefined;
  }

  try {
    const body = JSON.parse(text) as { paymentIntentId?: unknown };
    return typeof body.paymentIntentId === "string"
      ? body.paymentIntentId.trim()
      : undefined;
  } catch {
    return undefined;
  }
}

export async function resolvePaymentIntentId(
  request: NextRequest
): Promise<string> {
  const fromQuery =
    request.nextUrl.searchParams.get("paymentIntentId")?.trim() ||
    request.nextUrl.searchParams.get("payment_intent")?.trim() ||
    "";

  if (fromQuery.startsWith("pi_")) {
    return fromQuery;
  }

  const fromBody = await readPaymentIntentIdFromBody(request);
  if (fromBody?.startsWith("pi_")) {
    return fromBody;
  }

  return "";
}
