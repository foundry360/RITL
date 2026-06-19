import { NextRequest, NextResponse } from "next/server";
import { processAbandonedCheckoutReminders } from "@/lib/abandoned-checkout/process-reminders";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processAbandonedCheckoutReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Abandoned checkout cron failed:", error);
    const message = error instanceof Error ? error.message : "Cron failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
