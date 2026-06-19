import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-session";
import {
  getAdminDashboardStats,
  normalizeDashboardDays,
} from "@/lib/admin/stats";

export async function GET(request: NextRequest) {
  const user = await requireAdminSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = normalizeDashboardDays(
    Number(request.nextUrl.searchParams.get("days") ?? undefined)
  );

  try {
    const stats = await getAdminDashboardStats(days);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Admin dashboard fetch failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load dashboard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
