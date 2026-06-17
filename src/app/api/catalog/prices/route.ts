import { NextResponse } from "next/server";
import { getStripePricing } from "@/lib/stripe/fetch-prices";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const pricing = await getStripePricing();

  return NextResponse.json(pricing, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
