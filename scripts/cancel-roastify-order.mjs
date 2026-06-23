#!/usr/bin/env node

import { isPlaceholder, loadProjectEnv } from "./load-env.mjs";

function getApiBaseUrl() {
  return process.env.ROASTIFY_API_BASE_URL?.trim() || "https://api.roastify.app/v1";
}

function parseError(data, status, fallback) {
  if (typeof data?.message === "string") {
    return data.message;
  }
  if (typeof data?.error === "string") {
    return data.error;
  }
  return `${fallback} (${status})`;
}

async function fetchOrder(apiKey, orderId) {
  const response = await fetch(
    `${getApiBaseUrl()}/orders/${encodeURIComponent(orderId)}`,
    {
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseError(data, response.status, "Order lookup failed"));
  }

  return data;
}

async function cancelOrder(apiKey, orderId) {
  const response = await fetch(
    `${getApiBaseUrl()}/orders/${encodeURIComponent(orderId)}/cancel`,
    {
      method: "PUT",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseError(data, response.status, "Order cancel failed"));
  }

  return data;
}

async function main() {
  loadProjectEnv();

  const apiKey = process.env.ROASTIFY_API_KEY?.trim();
  if (isPlaceholder(apiKey)) {
    console.error("ROASTIFY_API_KEY is required in .env.local");
    process.exit(1);
  }

  const orderIds = process.argv.slice(2).filter(Boolean);
  if (orderIds.length === 0) {
    console.error(
      [
        "Usage: npm run roastify:cancel -- <orderId> [orderId...]",
        "",
        "Cancels Roastify API orders via PUT /v1/orders/{orderId}/cancel.",
        "Only works while the order is still in Created status.",
      ].join("\n")
    );
    process.exit(1);
  }

  for (const orderId of orderIds) {
    try {
      const order = await fetchOrder(apiKey, orderId);
      const status = order.orderStatus ?? order.status ?? "unknown";
      console.log(`Order ${orderId}: status=${status}`);

      if (status.toLowerCase() === "canceled" || status.toLowerCase() === "cancelled") {
        console.log(`  Already canceled — skipping`);
        continue;
      }

      const result = await cancelOrder(apiKey, orderId);
      console.log(`  ✓ ${result.message ?? "Canceled"}`);
    } catch (error) {
      console.error(
        `  ✗ ${error instanceof Error ? error.message : String(error)}`
      );
      process.exitCode = 1;
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
