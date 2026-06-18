#!/usr/bin/env node

import { isPlaceholder, loadProjectEnv } from "./load-env.mjs";

const DEFAULT_PRODUCTION_URL = "https://www.getritul.com";

function resolveAppUrl() {
  const productionOverride = process.env.PRODUCTION_APP_URL?.trim();
  if (productionOverride && !isPlaceholder(productionOverride)) {
    return productionOverride.replace(/\/$/, "");
  }

  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (
    fromEnv &&
    !isPlaceholder(fromEnv) &&
    !fromEnv.includes("localhost") &&
    !fromEnv.includes("127.0.0.1")
  ) {
    return fromEnv.replace(/\/$/, "");
  }

  return DEFAULT_PRODUCTION_URL;
}

async function probeWebhookRoute(webhookUrl) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });

  const body = await response.text();
  return { status: response.status, body: body.slice(0, 200) };
}

async function main() {
  loadProjectEnv();

  const webhookSecret = process.env.ROASTIFY_WEBHOOK_SECRET?.trim();
  const appUrl = resolveAppUrl();
  const webhookUrl = `${appUrl}/api/roastify/webhook`;

  console.log(`Checking Roastify webhook at ${webhookUrl}\n`);

  if (!webhookSecret || isPlaceholder(webhookSecret)) {
    console.error("✗ ROASTIFY_WEBHOOK_SECRET is not configured in .env.local");
    console.error("  Run: npm run roastify:webhook:setup");
    process.exit(1);
  }

  console.log("✓ ROASTIFY_WEBHOOK_SECRET is configured locally");

  if (!isRoastifyConfigured()) {
    console.error("✗ ROASTIFY_API_KEY is not configured");
    process.exit(1);
  }

  console.log("✓ ROASTIFY_API_KEY is configured");

  try {
    const probe = await probeWebhookRoute(webhookUrl);

    if (probe.status === 404) {
      console.error("✗ Webhook route not found on production (404)");
      console.error("  Deploy first: npx vercel --prod");
      process.exit(1);
    }

    if (probe.status === 500 && probe.body.includes("ROASTIFY_WEBHOOK_SECRET")) {
      console.error(
        "✗ Route is deployed but ROASTIFY_WEBHOOK_SECRET is missing in Vercel"
      );
      console.error("  Run: npm run vercel:env:push && npx vercel --prod");
      process.exit(1);
    }

    if (probe.status === 400) {
      console.log("✓ Production webhook route is live (rejects unsigned requests)");
    } else {
      console.warn(`⚠ Unexpected probe response: HTTP ${probe.status}`);
      if (probe.body) {
        console.warn(`  ${probe.body}`);
      }
    }
  } catch (error) {
    console.error(
      "✗ Failed to reach production webhook:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }

  console.log("");
  console.log("Next: send a test event from Roastify → endpoint → Testing tab");
}

function isRoastifyConfigured() {
  const apiKey = process.env.ROASTIFY_API_KEY?.trim();
  return Boolean(apiKey && !isPlaceholder(apiKey));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
