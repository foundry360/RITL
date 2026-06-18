import { NextRequest, NextResponse } from "next/server";
import { listAdminCustomers } from "@/lib/admin/customers";
import { requireAdminSession } from "@/lib/admin/require-session";

export async function GET(request: NextRequest) {
  const user = await requireAdminSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") ?? undefined;
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "25");
  const sortBy = searchParams.get("sortBy") ?? undefined;
  const sortDir = searchParams.get("sortDir") ?? undefined;

  try {
    const result = await listAdminCustomers({
      query,
      page,
      pageSize,
      sortBy,
      sortDir,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin customers fetch failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load customers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
