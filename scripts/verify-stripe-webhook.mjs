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

async function main() {
  loadProjectEnv();

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!secretKey || isPlaceholder(secretKey)) {
    console.error("STRIPE_SECRET_KEY is not configured.");
    process.exit(1);
  }

  const appUrl = resolveAppUrl();
  const webhookUrl = `${appUrl}/api/stripe/webhook`;
  const mode = secretKey.startsWith("sk_live_") ? "live" : "test";

  let hasError = false;

  if (!webhookSecret || isPlaceholder(webhookSecret)) {
    console.error("✗ STRIPE_WEBHOOK_SECRET is missing.");
    hasError = true;
  } else {
    console.log("✓ STRIPE_WEBHOOK_SECRET is set");
  }

  const stripe = new Stripe(secretKey);
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const endpoint = endpoints.data.find((item) => item.url === webhookUrl);

  if (!endpoint) {
    console.error(`✗ No webhook endpoint registered for ${webhookUrl}`);
    console.error(`  Run: npm run stripe:webhook:setup`);
    hasError = true;
  } else {
    console.log(`✓ Webhook endpoint registered (${mode}): ${endpoint.url}`);
    console.log(`  Status: ${endpoint.status}`);

    const enabled = endpoint.enabled_events.includes("*")
      ? STRIPE_WEBHOOK_EVENTS
      : endpoint.enabled_events;
    const missing = STRIPE_WEBHOOK_EVENTS.filter(
      (event) => !enabled.includes(event)
    );

    if (missing.length > 0) {
      console.error(`✗ Missing webhook events: ${missing.join(", ")}`);
      hasError = true;
    } else {
      console.log("✓ Required webhook events are enabled");
    }
  }

  if (appUrl.startsWith("http://localhost")) {
    console.warn(
      "⚠ NEXT_PUBLIC_APP_URL points to localhost. Production should use https://www.getritl.com"
    );
  } else if (!appUrl.startsWith("https://")) {
    console.error("✗ App URL must use HTTPS for Stripe webhooks.");
    hasError = true;
  } else {
    console.log(`✓ App URL: ${appUrl}`);
  }

  if (hasError) {
    process.exit(1);
  }

  console.log("");
  console.log("Webhook setup looks good.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
