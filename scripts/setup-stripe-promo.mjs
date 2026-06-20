#!/usr/bin/env node

import Stripe from "stripe";
import { isPlaceholder, loadProjectEnv } from "./load-env.mjs";

const PROMO_CODE = "10OFF";
const COUPON_NAME = "First purchase 10% off";

async function findPromotionCode(stripe, code) {
  const { data } = await stripe.promotionCodes.list({
    code,
    limit: 1,
    expand: ["data.promotion.coupon"],
  });

  return data[0] ?? null;
}

async function ensurePromoCode(stripe) {
  const existing = await findPromotionCode(stripe, PROMO_CODE);
  if (existing?.active) {
    console.log(`✓ Reusing promotion code ${PROMO_CODE} (${existing.id})`);
    return existing;
  }

  const coupon = await stripe.coupons.create({
    name: COUPON_NAME,
    percent_off: 10,
    duration: "once",
    metadata: {
      ritl_promo: PROMO_CODE,
    },
  });

  const promotionCode = await stripe.promotionCodes.create({
    promotion: {
      type: "coupon",
      coupon: coupon.id,
    },
    code: PROMO_CODE,
    metadata: {
      ritl_promo: PROMO_CODE,
    },
  });

  console.log(`✓ Created promotion code ${PROMO_CODE} (${promotionCode.id})`);
  return promotionCode;
}

async function main() {
  loadProjectEnv();

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (isPlaceholder(secretKey)) {
    console.error(
      "Missing STRIPE_SECRET_KEY. Add your Stripe secret key to .env or .env.local first."
    );
    process.exit(1);
  }

  const stripe = new Stripe(secretKey);
  const account = await stripe.accounts.retrieve();
  const mode = secretKey.startsWith("sk_live_") ? "live" : "test";

  console.log(`Connected to Stripe account: ${account.id} (${mode} mode)`);

  const promotionCode = await ensurePromoCode(stripe);
  const coupon = promotionCode.promotion?.coupon;

  if (coupon && typeof coupon !== "string") {
    console.log(
      `  Coupon: ${coupon.id} (${coupon.percent_off ?? 0}% off, duration: ${coupon.duration})`
    );
  }

  console.log("\nPromo code setup complete.");
  if (mode === "test") {
    console.log(
      "Run again with live STRIPE_SECRET_KEY to create 10OFF in production Stripe."
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
