#!/usr/bin/env node

import Stripe from "stripe";
import { isPlaceholder, loadProjectEnv } from "./load-env.mjs";
import { STRIPE_ENV_KEYS } from "./stripe-catalog.mjs";

async function main() {
  loadProjectEnv();

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (isPlaceholder(secretKey)) {
    console.error(
      "STRIPE_SECRET_KEY is not configured. Add it to .env or .env.local."
    );
    process.exit(1);
  }

  if (isPlaceholder(publishableKey)) {
    console.error(
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured. Add it to .env or .env.local."
    );
    process.exit(1);
  }

  const stripe = new Stripe(secretKey);
  const account = await stripe.accounts.retrieve();
  console.log(`✓ Stripe account: ${account.id}`);

  let hasError = false;

  for (const envKeys of Object.values(STRIPE_ENV_KEYS)) {
    for (const envKey of Object.values(envKeys)) {
      const priceId = process.env[envKey];

      if (!priceId || isPlaceholder(priceId)) {
        console.error(`✗ ${envKey} is missing. Run npm run stripe:setup`);
        hasError = true;
        continue;
      }

      const price = await stripe.prices.retrieve(priceId);

      if (!price.active) {
        console.error(`✗ ${envKey} (${priceId}) is inactive`);
        hasError = true;
        continue;
      }

      if (!price.unit_amount) {
        console.error(`✗ ${envKey} (${priceId}) is missing unit_amount`);
        hasError = true;
        continue;
      }

      const formatted = `$${(price.unit_amount / 100).toFixed(2)}`;
      console.log(`✓ ${envKey}=${priceId} (${formatted})`);
    }
  }

  if (hasError) {
    process.exit(1);
  }

  const { data: promoCodes } = await stripe.promotionCodes.list({
    code: "10OFF",
    active: true,
    limit: 1,
    expand: ["data.promotion.coupon"],
  });

  const promo = promoCodes[0];
  if (!promo) {
    console.error("✗ Promotion code 10OFF is missing. Run npm run stripe:setup:promo");
    process.exit(1);
  }

  const coupon = promo.promotion?.coupon;
  const percentOff =
    coupon && typeof coupon !== "string" ? coupon.percent_off : null;
  console.log(`✓ Promotion code 10OFF (${promo.id}, ${percentOff ?? 0}% off)`);

  console.log("\nStripe is connected and all configured prices are valid.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
