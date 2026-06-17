import {
  getRoastifyApiBaseUrl,
  getRoastifyApiKey,
  isRoastifyConfigured,
} from "@/lib/roastify/config";

export interface RoastifyCatalogProduct {
  id: string;
  name: string;
  sku: string;
}

export async function fetchRoastifyCatalog(): Promise<RoastifyCatalogProduct[]> {
  const response = await fetch(`${getRoastifyApiBaseUrl()}/catalog/products`, {
    headers: {
      "x-api-key": getRoastifyApiKey(),
      "Content-Type": "application/json",
    },
    next: { revalidate: 300 },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : typeof data?.error === "string"
          ? data.error
          : `Roastify catalog request failed (${response.status})`;
    throw new Error(message);
  }

  if (!Array.isArray(data)) {
    if (Array.isArray(data?.products)) {
      return parseCatalogProducts(data.products);
    }

    throw new Error("Roastify catalog response was not in the expected format.");
  }

  return parseCatalogProducts(data);
}

function parseCatalogProducts(products: unknown[]): RoastifyCatalogProduct[] {
  return products.flatMap((product: unknown) => {
    if (!product || typeof product !== "object") {
      return [];
    }

    const record = product as Record<string, unknown>;
    const id = record.id;
    const name =
      typeof record.title === "string"
        ? record.title
        : typeof record.name === "string"
          ? record.name
          : null;
    const sku = record.sku;

    if (typeof id !== "string" || typeof name !== "string") {
      return [];
    }

    return [{ id, name, sku: typeof sku === "string" ? sku : "" }];
  });
}

export async function getRoastifyStatus() {
  const apiKeyConfigured = isRoastifyConfigured();
  const focusSku = process.env.ROASTIFY_SKU_FOCUS_COFFEE?.trim();
  const matchaSku = process.env.ROASTIFY_SKU_MATCHA?.trim();
  const skuConfigured = Boolean(focusSku && matchaSku);

  if (!apiKeyConfigured) {
    return {
      connected: false,
      apiKeyConfigured,
      skuConfigured,
      catalogLoaded: false,
      products: [] as RoastifyCatalogProduct[],
    };
  }

  try {
    const products = await fetchRoastifyCatalog();

    return {
      connected: skuConfigured,
      apiKeyConfigured,
      skuConfigured,
      catalogLoaded: true,
      mappedSkusValid: skuConfigured,
      focusSku,
      matchaSku,
      products,
    };
  } catch (error) {
    return {
      connected: false,
      apiKeyConfigured,
      skuConfigured,
      catalogLoaded: false,
      products: [] as RoastifyCatalogProduct[],
      error: error instanceof Error ? error.message : "Failed to load catalog",
    };
  }
}
