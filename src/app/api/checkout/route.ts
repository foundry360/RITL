import { NextRequest, NextResponse } from "next/server";
import { recordAbandonedCheckout } from "@/lib/abandoned-checkout/repository";
import { isStripeSecretConfigured } from "@/lib/stripe/config";
import { createCheckoutPayment, type CheckoutItemInput } from "@/lib/stripe/create-payment";
import { getStripePricing } from "@/lib/stripe/fetch-prices";
import { getUnitPrice } from "@/lib/stripe/pricing";
import type { ProductId, PurchaseType } from "@/lib/stripe/products";

interface CheckoutItem {
  productId: ProductId;
  quantity: number;
  purchaseType?: PurchaseType;
}

function normalizeCheckoutItems(body: {
  productId?: ProductId;
  purchaseType?: PurchaseType;
  items?: CheckoutItem[];
}): CheckoutItemInput[] | null {
  if (body.items?.length) {
    return body.items
      .filter((item) => item.quantity > 0)
      .map((item) => ({
        productId: item.productId,
        quantity: Math.min(99, Math.floor(item.quantity)),
        purchaseType: (item.purchaseType === "subscription"
          ? "subscription"
          : "one-time") as PurchaseType,
      }));
  }

  if (body.productId) {
    return [
      {
        productId: body.productId,
        quantity: 1,
        purchaseType: (body.purchaseType === "subscription"
          ? "subscription"
          : "one-time") as PurchaseType,
      },
    ];
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    if (!isStripeSecretConfigured()) {
      return NextResponse.json(
        { error: "STRIPE_SECRET_KEY is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const checkoutItems = normalizeCheckoutItems(body);

    if (!checkoutItems?.length) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    const checkoutReference =
      typeof body.checkoutReference === "string" ? body.checkoutReference : undefined;
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!email) {
      return NextResponse.json(
        { error: "Customer email is required" },
        { status: 400 }
      );
    }

    const pricing = await getStripePricing();
    const payment = await createCheckoutPayment(
      checkoutItems,
      pricing,
      checkoutReference,
      email
    );

    const amountCents = checkoutItems.reduce((total, item) => {
      const unitAmount = Math.round(
        getUnitPrice(pricing, item.productId, item.purchaseType) * 100
      );
      return total + unitAmount * item.quantity;
    }, 0);

    try {
      await recordAbandonedCheckout({
        email,
        checkoutReference,
        items: checkoutItems,
        amountCents,
      });
    } catch (error) {
      console.error("Failed to record abandoned checkout:", error);
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Checkout payment error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
