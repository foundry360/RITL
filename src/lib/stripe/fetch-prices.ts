import { revalidateTag, unstable_cache } from "next/cache";
import { getStripeEnvConfig } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import {
  buildFallbackPricing,
  formatStripeAmount,
  type ProductPricingMap,
  type PriceQuote,
} from "@/lib/stripe/pricing";
import type { ProductId, PurchaseType } from "@/lib/stripe/products";

export const STRIPE_PRICING_CACHE_TAG = "stripe-prices";
const STRIPE_PRICING_REVALIDATE_SECONDS = 60;

const PURCHASE_TYPES: PurchaseType[] = ["one-time", "subscription"];

async function fetchStripePricingUncached(): Promise<ProductPricingMap> {
  const fallback = buildFallbackPricing();
  const { secretKey, priceIds } = getStripeEnvConfig();

  if (!secretKey) {
    return fallback;
  }

  const configuredEntries = (Object.keys(priceIds) as ProductId[]).flatMap(
    (productId) =>
      PURCHASE_TYPES.map((purchaseType) => ({
        productId,
        purchaseType,
        priceId: priceIds[productId][purchaseType],
      }))
  );

  if (!configuredEntries.every((entry) => entry.priceId)) {
    return fallback;
  }

  try {
    const stripe = getStripe();
    const pricing = buildFallbackPricing();

    await Promise.all(
      configuredEntries.map(async ({ productId, purchaseType, priceId }) => {
        if (!priceId) return;

        const price = await stripe.prices.retrieve(priceId);
        if (!price.unit_amount) {
          throw new Error(`Stripe price ${priceId} is missing unit_amount`);
        }

        const quote: PriceQuote = {
          amount: price.unit_amount / 100,
          label: formatStripeAmount(price.unit_amount, price.currency),
          source: "stripe",
        };

        pricing[productId][purchaseType] = quote;
      })
    );

    return pricing;
  } catch (error) {
    console.error("Failed to fetch Stripe prices, using fallback pricing:", error);
    return fallback;
  }
}

export const getStripePricing = unstable_cache(
  fetchStripePricingUncached,
  ["stripe-product-pricing"],
  {
    revalidate: STRIPE_PRICING_REVALIDATE_SECONDS,
    tags: [STRIPE_PRICING_CACHE_TAG],
  }
);

export function revalidateStripePricing() {
  revalidateTag(STRIPE_PRICING_CACHE_TAG, "max");
}

export async function getStripePricingStatus() {
  const { secretKey, publishableKey, priceIds } = getStripeEnvConfig();
  const pricing = await getStripePricing();
  const stripeBacked = (Object.keys(pricing) as ProductId[]).flatMap((productId) =>
    PURCHASE_TYPES.map((purchaseType) => pricing[productId][purchaseType])
  );

  return {
    secretKeyConfigured: Boolean(secretKey),
    publishableKeyConfigured: Boolean(publishableKey),
    priceIdsConfigured: (Object.keys(priceIds) as ProductId[]).every((productId) =>
      PURCHASE_TYPES.every((purchaseType) => Boolean(priceIds[productId][purchaseType]))
    ),
    pricesLoadedFromStripe: stripeBacked.every((quote) => quote.source === "stripe"),
    pricing,
    revalidateSeconds: STRIPE_PRICING_REVALIDATE_SECONDS,
  };
}
