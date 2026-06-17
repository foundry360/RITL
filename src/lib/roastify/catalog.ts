import { getProduct, type ProductId } from "@/lib/stripe/products";

function extractArtworkUrl(viewerUrl?: string): string | undefined {
  if (!viewerUrl) {
    return undefined;
  }

  try {
    const url = new URL(viewerUrl);
    return url.searchParams.get("artworkUrl") ?? undefined;
  } catch {
    return undefined;
  }
}

function getConfiguredArtworkUrl(productId: ProductId): string | undefined {
  const envMap: Record<ProductId, string | undefined> = {
    "focus-coffee": process.env.ROASTIFY_ARTWORK_URL_FOCUS_COFFEE,
    matcha: process.env.ROASTIFY_ARTWORK_URL_MATCHA,
  };

  return envMap[productId]?.trim() || extractArtworkUrl(getProduct(productId)?.viewerUrl);
}

export function getRoastifySku(productId: ProductId): string | undefined {
  const envMap: Record<ProductId, string | undefined> = {
    "focus-coffee": process.env.ROASTIFY_SKU_FOCUS_COFFEE,
    matcha: process.env.ROASTIFY_SKU_MATCHA,
  };

  return envMap[productId]?.trim();
}

export function getRoastifyArtworkUrl(productId: ProductId): string | undefined {
  return getConfiguredArtworkUrl(productId);
}
