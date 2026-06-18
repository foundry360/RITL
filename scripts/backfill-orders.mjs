#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { isPlaceholder, loadProjectEnv } from "./load-env.mjs";

function parseItems(raw) {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function resolveOrderType(items) {
  const purchaseTypes = new Set(items.map((item) => item.purchaseType));
  if (purchaseTypes.size === 0) {
    return null;
  }
  if (purchaseTypes.size > 1) {
    return "mixed";
  }
  return items[0]?.purchaseType === "subscription" ? "subscription" : "one-time";
}

function buildOrderPayload(paymentIntent) {
  const items = parseItems(paymentIntent.metadata?.ritl_items);
  if (items.length === 0) {
    return null;
  }

  const shipping = paymentIntent.shipping;
  const shippingAddress = shipping?.address?.line1
    ? [
        shipping.name,
        shipping.address.line1,
        shipping.address.line2,
        [shipping.address.city, shipping.address.state, shipping.address.postal_code]
          .filter(Boolean)
          .join(", "),
        shipping.address.country,
      ]
        .filter(Boolean)
        .join("\n")
    : null;

  const customer =
    paymentIntent.customer && typeof paymentIntent.customer !== "string"
      ? paymentIntent.customer
      : null;

  return {
    source: "website",
    stripe_payment_intent_id: paymentIntent.id,
    stripe_customer_id:
      typeof paymentIntent.customer === "string"
        ? paymentIntent.customer
        : paymentIntent.customer?.id ?? null,
    amount_cents: paymentIntent.amount,
    currency: paymentIntent.currency,
    order_type: resolveOrderType(items),
    customer_name: shipping?.name ?? customer?.name ?? customer?.email ?? null,
    customer_email: paymentIntent.receipt_email ?? customer?.email ?? null,
    shipping_address: shippingAddress,
    items,
    roastify_order_id: paymentIntent.metadata?.ritl_roastify_order_id ?? null,
    fulfillment_status: paymentIntent.metadata?.ritl_fulfillment_status ?? null,
    tracking_number: paymentIntent.metadata?.ritl_tracking_number ?? null,
    tracking_url: paymentIntent.metadata?.ritl_tracking_url ?? null,
    carrier: paymentIntent.metadata?.ritl_carrier ?? null,
    confirmation_email_sent_at:
      paymentIntent.metadata?.ritl_confirmation_email_sent === "true"
        ? new Date().toISOString()
        : null,
  };
}

async function listSucceededPaymentIntents(stripe) {
  const paymentIntents = [];
  let startingAfter;

  while (true) {
    const page = await stripe.paymentIntents.list({
      limit: 100,
      expand: ["data.customer"],
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    paymentIntents.push(...page.data.filter((pi) => pi.status === "succeeded"));

    if (!page.has_more || page.data.length === 0) {
      break;
    }

    startingAfter = page.data[page.data.length - 1]?.id;
  }

  return paymentIntents;
}

async function main() {
  loadProjectEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Orders database is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
    process.exit(1);
  }

  if (!secretKey || isPlaceholder(secretKey)) {
    console.error("STRIPE_SECRET_KEY is not configured.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const stripe = new Stripe(secretKey);
  const paymentIntents = await listSucceededPaymentIntents(stripe);

  console.log(`Backfilling ${paymentIntents.length} succeeded payment intents...`);

  let imported = 0;
  let skipped = 0;

  for (const paymentIntent of paymentIntents) {
    const payload = buildOrderPayload(paymentIntent);
    if (!payload) {
      skipped += 1;
      continue;
    }

    const { error } = await supabase
      .from("orders")
      .upsert(payload, { onConflict: "stripe_payment_intent_id" });

    if (error) {
      console.error(`✗ ${paymentIntent.id}: ${error.message}`);
      continue;
    }

    imported += 1;
    console.log(`✓ ${paymentIntent.id}`);
  }

  console.log(`\nDone. Imported ${imported}, skipped ${skipped}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
