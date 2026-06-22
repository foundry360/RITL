import { NextRequest, NextResponse } from "next/server";
import { verifyAbandonedCheckoutRecovery } from "@/lib/abandoned-checkout/recovery-token";
import { getAbandonedCheckoutById } from "@/lib/abandoned-checkout/repository";

export async function GET(request: NextRequest) {
  const recover = request.nextUrl.searchParams.get("recover")?.trim();
  const token = request.nextUrl.searchParams.get("token")?.trim();

  if (!recover || !token || !verifyAbandonedCheckoutRecovery(recover, token)) {
    return NextResponse.json({ error: "Invalid recovery link" }, { status: 400 });
  }

  const record = await getAbandonedCheckoutById(recover);
  if (!record || record.convertedAt || record.items.length === 0) {
    return NextResponse.json({ error: "Recovery unavailable" }, { status: 404 });
  }

  return NextResponse.json({ items: record.items });
}
