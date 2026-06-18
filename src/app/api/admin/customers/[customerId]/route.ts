import { NextResponse } from "next/server";
import { getAdminCustomer } from "@/lib/admin/customers";
import { requireAdminSession } from "@/lib/admin/require-session";

interface RouteContext {
  params: Promise<{ customerId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireAdminSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { customerId } = await context.params;

  try {
    const customer = await getAdminCustomer(customerId);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("Admin customer fetch failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load customer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
