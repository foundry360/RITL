import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-session";
import { normalizeDashboardDays } from "@/lib/admin/stats";
import { getWebsiteAnalyticsData } from "@/lib/analytics/ga-data";

export async function GET(request: NextRequest) {
  const user = await requireAdminSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = normalizeDashboardDays(
    Number(request.nextUrl.searchParams.get("days") ?? undefined)
  );

  try {
    const analytics = await getWebsiteAnalyticsData(days);
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Admin analytics fetch failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load analytics";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
