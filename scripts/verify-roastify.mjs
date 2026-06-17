#!/usr/bin/env node

import { isPlaceholder, loadProjectEnv } from "./load-env.mjs";
import { ROASTIFY_PRODUCTS } from "./roastify-catalog.mjs";

function getApiBaseUrl() {
  return process.env.ROASTIFY_API_BASE_URL?.trim() || "https://api.roastify.app/v1";
}

function normalizeCatalogProducts(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.products)) {
    return data.products;
  }

  return null;
}

async function fetchCatalog(apiKey) {
  const response = await fetch(`${getApiBaseUrl()}/catalog/products`, {
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json().catch(() => ({}));
  const products = normalizeCatalogProducts(data);

  if (!response.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : typeof data?.error === "string"
          ? data.error
          : `Catalog request failed (${response.status})`;
    throw new Error(message);
  }

  if (!products) {
    throw new Error("Roastify catalog response was not in the expected format.");
  }

  return products;
}

async function validateSku(apiKey, sku, artworkUrl) {
  const response = await fetch(`${getApiBaseUrl()}/orders`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      "Idempotency-Key": `ritl-verify-${sku}-${Date.now()}`,
    },
    body: JSON.stringify({
      toAddress: {
        name: "RITL Verify",
        street1: "123 Main St",
        city: "Austin",
        state: "TX",
        zip: "78701",
        country: "US",
        email: "verify@ritl.test",
      },
      items: [
        {
          sku,
          quantity: 1,
          ...(artworkUrl ? { artworkUrl } : {}),
        },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 201) {
    return { valid: true, orderId: data.orderId };
  }

  const errors = Array.isArray(data?.errors) ? data.errors : [];
  const message =
    errors.map((entry) => entry?.message).filter(Boolean).join("; ") ||
    data?.message ||
    `SKU validation failed (${response.status})`;

  return { valid: false, message };
}

async function main() {
  loadProjectEnv();

  const apiKey = process.env.ROASTIFY_API_KEY;

  if (isPlaceholder(apiKey)) {
    console.error(
      "ROASTIFY_API_KEY is not configured. Add it to .env.local, then rerun."
    );
    process.exit(1);
  }

  const products = await fetchCatalog(apiKey);
  console.log(`✓ Roastify API connected (${products.length} catalog products)`);

  if (products.length > 0) {
    console.log("\nCatalog products:");
    for (const product of products) {
      const title = product?.title ?? product?.name ?? "Unnamed product";
      const type = product?.productType ? ` (${product.productType})` : "";
      console.log(`  - ${title}${type}`);
    }
  }

  let hasError = false;

  console.log("\nRITL product mapping:");
  for (const product of ROASTIFY_PRODUCTS) {
    const sku = process.env[product.skuEnvKey]?.trim();
    const artwork =
      process.env[product.artworkEnvKey]?.trim() || product.defaultArtworkUrl;

    if (!sku) {
      console.error(`✗ ${product.skuEnvKey} is missing for ${product.name}`);
      hasError = true;
      continue;
    }

    const validation = await validateSku(apiKey, sku, artwork);
    if (!validation.valid) {
      console.error(`✗ ${product.name}: ${product.skuEnvKey}=${sku}`);
      console.error(`  ${validation.message}`);
      hasError = true;
      continue;
    }

    console.log(`✓ ${product.name}: ${product.skuEnvKey}=${sku}`);
    console.log(`  artwork: ${artwork}`);
    console.log(`  test order: ${validation.orderId}`);
  }

  if (hasError) {
    process.exit(1);
  }

  console.log(
    "\nRoastify is configured. Test orders were created to validate SKUs."
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
