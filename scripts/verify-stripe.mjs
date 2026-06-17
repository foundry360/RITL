#!/usr/bin/env node

import Stripe from "stripe";
import { isPlaceholder, loadProjectEnv } from "./load-env.mjs";
import { EXPECTED_PRICE_AMOUNTS } from "./stripe-catalog.mjs";

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
  let hasCatalogMismatch = false;

  for (const [envKey, catalogAmount] of Object.entries(EXPECTED_PRICE_AMOUNTS)) {
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

    if (price.unit_amount !== catalogAmount) {
      hasCatalogMismatch = true;
      console.warn(
        `  ! Catalog fallback expects $${(catalogAmount / 100).toFixed(2)}. Stripe price will be used on the site.`
      );
    }
  }

  if (hasError) {
    process.exit(1);
  }

  if (hasCatalogMismatch) {
    console.log(
      "\nStripe is connected. Live prices differ from local catalog fallbacks, which is fine."
    );
    return;
  }

  console.log("\nStripe is connected and all catalog prices are valid.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
