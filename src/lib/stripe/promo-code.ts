import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";

export interface ResolvedPromoCode {
  promotionCodeId: string;
  code: string;
  percentOff: number | null;
  amountOff: number | null;
  currency: string | null;
}

function getCouponFromPromotionCode(
  promotionCode: Stripe.PromotionCode
): Stripe.Coupon | null {
  const coupon = promotionCode.promotion?.coupon;
  if (!coupon || typeof coupon === "string") {
    return null;
  }

  if (coupon.valid === false) {
    return null;
  }

  return coupon;
}

export async function resolvePromotionCode(
  code: string
): Promise<ResolvedPromoCode | null> {
  const trimmed = code.trim();
  if (!trimmed) {
    return null;
  }

  const stripe = getStripe();
  const { data } = await stripe.promotionCodes.list({
    code: trimmed,
    active: true,
    limit: 1,
    expand: ["data.promotion.coupon"],
  });

  const promotionCode = data[0];
  if (!promotionCode) {
    return null;
  }

  const coupon = getCouponFromPromotionCode(promotionCode);
  if (!coupon) {
    return null;
  }

  return {
    promotionCodeId: promotionCode.id,
    code: promotionCode.code,
    percentOff: coupon.percent_off ?? null,
    amountOff: coupon.amount_off ?? null,
    currency: coupon.currency ?? null,
  };
}

export function calculateDiscountCents(
  subtotalCents: number,
  promo: ResolvedPromoCode
): number {
  if (subtotalCents <= 0) {
    return 0;
  }

  if (promo.percentOff) {
    return Math.round((subtotalCents * promo.percentOff) / 100);
  }

  if (promo.amountOff) {
    if (promo.currency && promo.currency !== "usd") {
      return 0;
    }

    return Math.min(subtotalCents, promo.amountOff);
  }

  return 0;
}

export function normalizePromoCodeInput(code: string): string {
  return code.trim().toUpperCase();
}
