import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { syncGhlOrderFulfillmentProgressSafe } from "../src/lib/gohighlevel/sync-order";
import { isOrdersDatabaseConfigured } from "../src/lib/supabase/config";
import { createSupabaseServiceClient } from "../src/lib/supabase/service";

function loadEnvFile(filename: string) {
  try {
    const contents = readFileSync(resolve(process.cwd(), filename), "utf8");
    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const separator = trimmed.indexOf("=");
      if (separator === -1) {
        continue;
      }
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // Optional env file.
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

async function main() {
  if (!isOrdersDatabaseConfigured()) {
    console.error("Supabase is not configured.");
    process.exit(1);
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "stripe_payment_intent_id, roastify_order_id, fulfillment_status, tracking_number, tracking_url, carrier"
    )
    .not("fulfillment_status", "is", null)
    .neq("fulfillment_status", "created");

  if (error) {
    throw new Error(error.message);
  }

  let synced = 0;
  for (const order of data ?? []) {
    await syncGhlOrderFulfillmentProgressSafe({
      stripePaymentIntentId: order.stripe_payment_intent_id,
      roastifyOrderId: order.roastify_order_id,
      fulfillmentStatus: order.fulfillment_status,
      trackingNumber: order.tracking_number,
      trackingUrl: order.tracking_url,
      carrier: order.carrier,
    });
    synced += 1;
  }

  console.log(`Backfilled GHL fulfillment for ${synced} order(s).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
