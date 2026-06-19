import { NextRequest, NextResponse } from "next/server";
import { resolvePaymentIntentId } from "@/lib/fulfillment/resolve-payment-intent-id";
import { processSuccessfulPaymentIntent } from "@/lib/fulfillment/process-payment-intent";
import { isStripeSecretConfigured } from "@/lib/stripe/config";

export async function POST(request: NextRequest) {
  if (!isStripeSecretConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 500 }
    );
  }

  try {
    const paymentIntentId = await resolvePaymentIntentId(request);

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "A valid paymentIntentId is required" },
        { status: 400 }
      );
    }

    const result = await processSuccessfulPaymentIntent(paymentIntentId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Fulfillment submit failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to submit fulfillment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
