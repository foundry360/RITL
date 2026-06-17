import { NextRequest, NextResponse } from "next/server";
import { resolveCheckoutCustomer } from "@/lib/stripe/checkout-customer";
import { isStripeSecretConfigured } from "@/lib/stripe/config";

interface UpdateCustomerBody {
  customerId?: string;
  clientSecret?: string;
  mode?: "payment" | "subscription";
  email?: string;
  name?: string;
  phone?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export async function PATCH(request: NextRequest) {
  try {
    if (!isStripeSecretConfigured()) {
      return NextResponse.json(
        { error: "STRIPE_SECRET_KEY is not configured" },
        { status: 500 }
      );
    }

    const body = (await request.json()) as UpdateCustomerBody;
    const { customerId, clientSecret, mode, email, name, phone, address } = body;

    if (!customerId?.startsWith("cus_")) {
      return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
    }

    if (!clientSecret?.includes("_secret_")) {
      return NextResponse.json(
        { error: "Payment session is required" },
        { status: 400 }
      );
    }

    if (mode !== "payment" && mode !== "subscription") {
      return NextResponse.json({ error: "Invalid checkout mode" }, { status: 400 });
    }

    if (!email?.trim() || !name?.trim() || !address?.line1 || !address?.country) {
      return NextResponse.json(
        { error: "Customer email, name, and address are required" },
        { status: 400 }
      );
    }

    const resolvedCustomerId = await resolveCheckoutCustomer({
      email: email.trim(),
      sessionCustomerId: customerId,
      clientSecret,
      mode,
      details: {
        email: email.trim(),
        name: name.trim(),
        phone: phone?.trim() || undefined,
        address: {
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: address.country,
        },
      },
    });

    return NextResponse.json({
      success: true,
      customerId: resolvedCustomerId,
    });
  } catch (error) {
    console.error("Checkout customer update error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
