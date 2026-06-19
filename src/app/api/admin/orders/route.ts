import { NextRequest, NextResponse } from "next/server";
import { listAdminOrders } from "@/lib/admin/orders";
import { normalizeAdminOrderDateFilter } from "@/lib/admin/order-filters";
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
  const progress = searchParams.get("progress") ?? undefined;
  const productId = searchParams.get("productId") ?? undefined;
  const orderType = searchParams.get("orderType") ?? undefined;
  const dateFrom = normalizeAdminOrderDateFilter(
    searchParams.get("dateFrom") ?? undefined
  );
  const dateTo = normalizeAdminOrderDateFilter(searchParams.get("dateTo") ?? undefined);

  try {
    const result = await listAdminOrders({
      query,
      page,
      pageSize,
      sortBy,
      sortDir,
      progress: progress || undefined,
      productId: productId || undefined,
      orderType: orderType || undefined,
      dateFrom,
      dateTo,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin orders fetch failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
