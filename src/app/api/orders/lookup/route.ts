import { NextRequest, NextResponse } from "next/server";
import { lookupGuestOrder } from "@/lib/orders/guest-lookup";
import { isOrdersDatabaseConfigured } from "@/lib/supabase/config";

export async function POST(request: NextRequest) {
  try {
    if (!isOrdersDatabaseConfigured()) {
      return NextResponse.json(
        { error: "Order lookup is temporarily unavailable." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const orderNumber =
      typeof body.orderNumber === "string" ? body.orderNumber.trim() : "";

    if (!email || !name || !orderNumber) {
      return NextResponse.json(
        { error: "Email, name, and order number are required." },
        { status: 400 }
      );
    }

    const order = await lookupGuestOrder({ email, name, orderNumber });

    if (!order) {
      return NextResponse.json(
        {
          error:
            "We couldn't find an order matching those details. Check your confirmation email and try again.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Guest order lookup failed:", error);
    return NextResponse.json(
      { error: "Unable to look up your order right now." },
      { status: 500 }
    );
  }
}
