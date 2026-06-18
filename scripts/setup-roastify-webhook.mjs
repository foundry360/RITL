#!/usr/bin/env node

import { isPlaceholder, loadProjectEnv } from "./load-env.mjs";
import { ROASTIFY_WEBHOOK_EVENTS } from "./roastify-webhook-events.mjs";

const DEFAULT_PRODUCTION_URL = "https://www.getritl.com";
const ROASTIFY_DEVELOPERS_URL = "https://merchant.roastify.app/";

function resolveAppUrl() {
  const fromEnv =
    process.env.PRODUCTION_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!fromEnv || isPlaceholder(fromEnv)) {
    return DEFAULT_PRODUCTION_URL;
  }

  return fromEnv.replace(/\/$/, "");
}

function main() {
  loadProjectEnv();

  const appUrl = resolveAppUrl();
  if (!appUrl.startsWith("https://")) {
    console.error(
      `App URL must use HTTPS for Roastify webhooks. Got: ${appUrl}`
    );
    process.exit(1);
  }

  const webhookUrl = `${appUrl}/api/roastify/webhook`;
  const existingSecret = process.env.ROASTIFY_WEBHOOK_SECRET?.trim();

  console.log("Roastify webhook setup\n");
  console.log("Webhook URL (register this in Roastify):");
  console.log(`  ${webhookUrl}\n`);
  console.log("Subscribe to these events:");
  for (const event of ROASTIFY_WEBHOOK_EVENTS) {
    console.log(`  • ${event}`);
  }
  console.log("");
  console.log("Dashboard steps:");
  console.log(`  1. Open ${ROASTIFY_DEVELOPERS_URL}`);
  console.log("  2. Go to Connections → Developers");
  console.log("  3. Enable Webhooks (if not already enabled)");
  console.log("  4. Add Endpoint → paste the webhook URL above");
  console.log("  5. Select the events listed above");
  console.log("  6. Copy the endpoint Signing Secret (whsec_...)");
  console.log("");
  console.log("Then add the secret locally and push to Vercel:");
  console.log("  ROASTIFY_WEBHOOK_SECRET=whsec_...   # in .env.local");
  console.log("  npm run vercel:env:push");
  console.log("  npx vercel --prod");
  console.log("");
  console.log("Verify:");
  console.log("  npm run roastify:webhook:verify");
  console.log("");

  if (existingSecret && !isPlaceholder(existingSecret)) {
    console.log("✓ ROASTIFY_WEBHOOK_SECRET is already set in .env.local");
    console.log("  Run npm run vercel:env:push if production does not have it yet.");
  } else {
    console.log(
      "⚠ ROASTIFY_WEBHOOK_SECRET is not set yet — add it after creating the endpoint."
    );
  }
}

main();
