import { NextResponse } from "next/server";
import { getStripePricingStatus } from "@/lib/stripe/fetch-prices";

export async function GET() {
  try {
    const status = await getStripePricingStatus();
    const connected =
      status.secretKeyConfigured &&
      status.publishableKeyConfigured &&
      status.priceIdsConfigured &&
      status.pricesLoadedFromStripe;

    return NextResponse.json({
      connected,
      ...status,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to verify Stripe connection";
    return NextResponse.json({ connected: false, error: message }, { status: 500 });
  }
}
