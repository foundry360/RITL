import { NextRequest, NextResponse } from "next/server";
import { isStripeSecretConfigured } from "@/lib/stripe/config";
import { getStripePricing } from "@/lib/stripe/fetch-prices";
import { getUnitPrice } from "@/lib/stripe/pricing";
import {
  calculateDiscountCents,
  normalizePromoCodeInput,
  resolvePromotionCode,
} from "@/lib/stripe/promo-code";
import type { ProductId, PurchaseType } from "@/lib/stripe/products";

interface PromoItem {
  productId: ProductId;
  quantity: number;
  purchaseType?: PurchaseType;
}

function normalizeItems(items: PromoItem[] | undefined) {
  if (!items?.length) {
    return null;
  }

  return items
    .filter((item) => item.quantity > 0)
    .map((item) => ({
      productId: item.productId,
      quantity: Math.min(99, Math.floor(item.quantity)),
      purchaseType: (item.purchaseType === "subscription"
        ? "subscription"
        : "one-time") as PurchaseType,
    }));
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
    const code =
      typeof body.code === "string" ? normalizePromoCodeInput(body.code) : "";
    const checkoutItems = normalizeItems(body.items);

    if (!code) {
      return NextResponse.json({ error: "Promo code is required" }, { status: 400 });
    }

    if (!checkoutItems?.length) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    const promo = await resolvePromotionCode(code);
    if (!promo) {
      return NextResponse.json({ error: "Invalid or expired promo code" }, { status: 400 });
    }

    const pricing = await getStripePricing();
    const subtotalCents = checkoutItems.reduce((total, item) => {
      const unitAmount = Math.round(
        getUnitPrice(pricing, item.productId, item.purchaseType) * 100
      );
      return total + unitAmount * item.quantity;
    }, 0);

    const discountCents = calculateDiscountCents(subtotalCents, promo);
    if (discountCents <= 0) {
      return NextResponse.json(
        { error: "Promo code does not apply to this order" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      code: promo.code,
      percentOff: promo.percentOff,
      amountOff: promo.amountOff,
      subtotalCents,
      discountCents,
      totalCents: subtotalCents - discountCents,
    });
  } catch (error) {
    console.error("Promo code validation error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
