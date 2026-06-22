#!/usr/bin/env node

import { isPlaceholder, loadProjectEnv } from "./load-env.mjs";

const GHL_API_BASE_URL = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";

async function probeGhlLocation(apiToken, locationId) {
  const response = await fetch(`${GHL_API_BASE_URL}/locations/${locationId}`, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Accept: "application/json",
      Version: GHL_API_VERSION,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    const message =
      data.message || data.error || "Failed to load GoHighLevel location";
    throw new Error(message);
  }

  return data.location ?? data;
}

async function main() {
  loadProjectEnv();

  const apiToken = process.env.GHL_API_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;

  if (isPlaceholder(apiToken)) {
    console.error(
      "GHL_API_TOKEN is required. Create a Private Integration in GHL Settings → Integrations."
    );
    process.exit(1);
  }

  if (isPlaceholder(locationId)) {
    console.error(
      "GHL_LOCATION_ID is required. Find it in GHL Settings → Business Profile (or the /location/{id}/ URL)."
    );
    process.exit(1);
  }

  const location = await probeGhlLocation(apiToken, locationId);

  console.log("✓ GoHighLevel connected");
  console.log(`  Location: ${location.name ?? locationId}`);
  console.log(`  Location ID: ${location.id ?? locationId}`);

  const tags = process.env.GHL_CUSTOMER_TAGS?.trim() || "ritul-customer";
  console.log(`  Customer tags: ${tags}`);

  const websiteLeadTag =
    process.env.GHL_WEBSITE_LEAD_TAG?.trim() || "website-lead";
  console.log(`  Website lead tag (new): ${websiteLeadTag}`);

  const websiteLeadResubmitTag =
    process.env.GHL_WEBSITE_LEAD_RESUBMIT_TAG?.trim() || "website-lead-returning";
  console.log(`  Website lead tag (resubmit): ${websiteLeadResubmitTag}`);

  const mailingListTag =
    process.env.GHL_MAILING_LIST_TAG?.trim() || "mailing-list";
  console.log(`  Mailing list tag: ${mailingListTag}`);

  if (process.env.GHL_STRIPE_CUSTOMER_FIELD_ID?.trim()) {
    console.log(
      `  Stripe field: ${process.env.GHL_STRIPE_CUSTOMER_FIELD_ID.trim()}`
    );
  } else {
    console.log("  Stripe field: not mapped (optional GHL_STRIPE_CUSTOMER_FIELD_ID)");
  }

  console.log(
    "\nGoHighLevel is ready. Purchases sync customer tags; modal signups use lead tags; mailing list signups use the mailing list tag."
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
