#!/usr/bin/env node

import Stripe from "stripe";
import { isPlaceholder, loadProjectEnv } from "./load-env.mjs";
import { STRIPE_WEBHOOK_EVENTS } from "./stripe-webhook-events.mjs";

const DEFAULT_PRODUCTION_URL = "https://www.getritl.com";

function resolveAppUrl() {
  const fromEnv =
    process.env.PRODUCTION_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!fromEnv || isPlaceholder(fromEnv)) {
    return DEFAULT_PRODUCTION_URL;
  }

  return fromEnv.replace(/\/$/, "");
}

function isLiveKey(secretKey) {
  return secretKey.startsWith("sk_live_");
}

function isTestKey(secretKey) {
  return secretKey.startsWith("sk_test_");
}

function parseArgs(argv) {
  const force = argv.includes("--force");
  const liveOnly = argv.includes("--live");
  const testOnly = argv.includes("--test");
  return { force, liveOnly, testOnly };
}

async function main() {
  loadProjectEnv();
  const { force, liveOnly, testOnly } = parseArgs(process.argv.slice(2));

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey || isPlaceholder(secretKey)) {
    console.error(
      "STRIPE_SECRET_KEY is not configured. Add live keys for production setup."
    );
    process.exit(1);
  }

  if (liveOnly && !isLiveKey(secretKey)) {
    console.error(
      "Pass --live only when STRIPE_SECRET_KEY is a live key (sk_live_...)."
    );
    process.exit(1);
  }

  if (testOnly && !isTestKey(secretKey)) {
    console.error(
      "Pass --test only when STRIPE_SECRET_KEY is a test key (sk_test_...)."
    );
    process.exit(1);
  }

  const appUrl = resolveAppUrl();
  if (!appUrl.startsWith("https://")) {
    console.error(
      `App URL must use HTTPS for Stripe webhooks. Got: ${appUrl}`
    );
    process.exit(1);
  }

  const webhookUrl = `${appUrl}/api/stripe/webhook`;
  const mode = isLiveKey(secretKey) ? "live" : "test";

  if (mode === "test") {
    console.warn(
      "Using Stripe test mode keys. For production, set STRIPE_SECRET_KEY=sk_live_... and rerun."
    );
  }

  const stripe = new Stripe(secretKey);
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const existing = endpoints.data.find((endpoint) => endpoint.url === webhookUrl);

  if (existing && !force) {
    console.log(`✓ Webhook endpoint already exists (${mode}): ${webhookUrl}`);
    console.log(`  Endpoint ID: ${existing.id}`);
    console.log(`  Status: ${existing.status}`);
    console.log(
      "  Events:",
      existing.enabled_events.includes("*")
        ? "all events"
        : existing.enabled_events.join(", ")
    );
    console.log("");
    console.log(
      "To rotate the signing secret, delete this endpoint in Stripe Dashboard"
    );
    console.log(
      "or rerun with --force to create a new endpoint (old one stays active)."
    );
    console.log("");
    console.log("Add the signing secret to Vercel → Settings → Environment Variables:");
    console.log("  STRIPE_WEBHOOK_SECRET=whsec_...");
    return;
  }

  const endpoint = await stripe.webhookEndpoints.create({
    url: webhookUrl,
    enabled_events: STRIPE_WEBHOOK_EVENTS,
    description: `RITL ${mode} — orders, pricing, fulfillment`,
  });

  console.log(`✓ Created Stripe webhook endpoint (${mode})`);
  console.log(`  URL: ${endpoint.url}`);
  console.log(`  Endpoint ID: ${endpoint.id}`);
  console.log(`  Events: ${STRIPE_WEBHOOK_EVENTS.join(", ")}`);
  console.log("");
  console.log("Signing secret (add to Vercel Production env):");
  console.log(`  STRIPE_WEBHOOK_SECRET=${endpoint.secret}`);
  console.log("");
  console.log(
    "Also set NEXT_PUBLIC_APP_URL in Vercel Production to match this host:"
  );
  console.log(`  NEXT_PUBLIC_APP_URL=${appUrl}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
