#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import Stripe from "stripe";
import { isPlaceholder, loadProjectEnv } from "./load-env.mjs";

const CATALOG = [
  {
    productId: "focus-coffee",
    name: "Focus Coffee",
    description:
      "A refined functional blend engineered for alert clarity and sustained mental performance.",
    oneTimeAmount: 4800,
    subscriptionAmount: 4080,
    intervalWeeks: 4,
  },
  {
    productId: "matcha",
    name: "Matcha",
    description:
      "Ceremonial-grade matcha with functional enhancements for smooth, sustained cognitive energy.",
    oneTimeAmount: 5200,
    subscriptionAmount: 4420,
    intervalWeeks: 4,
  },
];

const ENV_KEYS = {
  "focus-coffee": {
    "one-time": "STRIPE_PRICE_FOCUS_COFFEE",
    subscription: "STRIPE_PRICE_FOCUS_COFFEE_SUBSCRIPTION",
  },
  matcha: {
    "one-time": "STRIPE_PRICE_MATCHA",
    subscription: "STRIPE_PRICE_MATCHA_SUBSCRIPTION",
  },
};

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};

  const values = {};
  const content = readFileSync(filePath, "utf8");

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    values[key] = value;
  }

  return values;
}

function upsertEnvValue(filePath, key, value) {
  const line = `${key}=${value}`;
  if (!existsSync(filePath)) {
    writeFileSync(filePath, `${line}\n`, "utf8");
    return;
  }

  const content = readFileSync(filePath, "utf8");
  const pattern = new RegExp(`^${key}=.*$`, "m");

  if (pattern.test(content)) {
    writeFileSync(filePath, content.replace(pattern, line), "utf8");
    return;
  }

  const suffix = content.endsWith("\n") ? "" : "\n";
  writeFileSync(filePath, `${content}${suffix}${line}\n`, "utf8");
}

async function ensurePrice(stripe, productId, type, config) {
  const envKey = ENV_KEYS[productId][type];
  const existingPriceId = process.env[envKey];

  if (existingPriceId) {
    const existing = await stripe.prices.retrieve(existingPriceId);
    console.log(`✓ Reusing ${envKey}=${existing.id}`);
    return existing.id;
  }

  const stripeProduct = await stripe.products.create({
    name: type === "subscription" ? `${config.name} Subscription` : config.name,
    description: config.description,
    metadata: {
      ritl_product_id: productId,
      ritl_purchase_type: type,
    },
  });

  const price = await stripe.prices.create({
    product: stripeProduct.id,
    currency: "usd",
    unit_amount: type === "subscription" ? config.subscriptionAmount : config.oneTimeAmount,
    ...(type === "subscription"
      ? {
          recurring: {
            interval: "week",
            interval_count: config.intervalWeeks,
          },
        }
      : {}),
    metadata: {
      ritl_product_id: productId,
      ritl_purchase_type: type,
    },
  });

  console.log(`✓ Created ${envKey}=${price.id}`);
  return price.id;
}

async function main() {
  const rootDir = resolve(process.cwd());
  const envLocalPath = resolve(rootDir, ".env.local");
  const envExamplePath = resolve(rootDir, ".env.example");

  loadProjectEnv(rootDir);

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (isPlaceholder(secretKey)) {
    console.error(
      "Missing STRIPE_SECRET_KEY. Add your Stripe test secret key to .env or .env.local first."
    );
    process.exit(1);
  }

  const stripe = new Stripe(secretKey);
  const account = await stripe.accounts.retrieve();
  console.log(`Connected to Stripe account: ${account.id}`);

  if (!existsSync(envLocalPath) && existsSync(envExamplePath)) {
    writeFileSync(envLocalPath, readFileSync(envExamplePath, "utf8"), "utf8");
    console.log("Created .env.local from .env.example");
  }

  for (const item of CATALOG) {
    for (const type of ["one-time", "subscription"]) {
      const priceId = await ensurePrice(stripe, item.productId, type, item);
      const envKey = ENV_KEYS[item.productId][type];
      upsertEnvValue(envLocalPath, envKey, priceId);
      process.env[envKey] = priceId;
    }
  }

  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.log(
      "\nAdd NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env.local from your Stripe dashboard."
    );
  }

  console.log("\nStripe catalog setup complete.");
  console.log("Run `npm run stripe:verify` to confirm the connection.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
