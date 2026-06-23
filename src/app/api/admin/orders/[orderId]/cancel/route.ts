import { NextResponse } from "next/server";
import { cancelAdminOrder } from "@/lib/admin/cancel-order";
import { requireAdminSession } from "@/lib/admin/require-session";

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const user = await requireAdminSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await context.params;

  try {
    const order = await cancelAdminOrder(orderId);
    return NextResponse.json({ order });
  } catch (error) {
    console.error(`Admin order cancel failed for ${orderId}:`, error);
    const message =
      error instanceof Error ? error.message : "Failed to cancel order";
    const status = message === "Order not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
