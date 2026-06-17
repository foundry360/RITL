import type { ProductId, PurchaseType } from "@/lib/stripe/products";

export interface StripeEnvConfig {
  secretKey?: string;
  publishableKey?: string;
  priceIds: Record<ProductId, Record<PurchaseType, string | undefined>>;
}

export function getStripeEnvConfig(): StripeEnvConfig {
  return {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    priceIds: {
      "focus-coffee": {
        "one-time": process.env.STRIPE_PRICE_FOCUS_COFFEE,
        subscription: process.env.STRIPE_PRICE_FOCUS_COFFEE_SUBSCRIPTION,
      },
      matcha: {
        "one-time": process.env.STRIPE_PRICE_MATCHA,
        subscription: process.env.STRIPE_PRICE_MATCHA_SUBSCRIPTION,
      },
    },
  };
}

export function isStripeSecretConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function isStripePublishableConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

export function areStripePriceIdsConfigured(): boolean {
  const { priceIds } = getStripeEnvConfig();
  return Object.values(priceIds).every((productPrices) =>
    Object.values(productPrices).every(Boolean)
  );
}

export function getConfiguredPriceIds(): string[] {
  const { priceIds } = getStripeEnvConfig();
  return Object.values(priceIds).flatMap((productPrices) =>
    Object.values(productPrices).filter((priceId): priceId is string =>
      Boolean(priceId)
    )
  );
}
