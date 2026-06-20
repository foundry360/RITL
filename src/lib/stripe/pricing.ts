import { formatPrice } from "@/lib/checkout/format";
import {
  products,
  type ProductId,
  type PurchaseType,
} from "@/lib/stripe/products";

export interface PriceQuote {
  amount: number;
  label: string;
  source: "stripe" | "fallback";
}

export type ProductPricingMap = Record<
  ProductId,
  Record<PurchaseType, PriceQuote>
>;

const UNAVAILABLE_PRICE_QUOTE: PriceQuote = {
  amount: 0,
  label: "—",
  source: "fallback",
};

export function buildFallbackPricing(): ProductPricingMap {
  return (Object.keys(products) as ProductId[]).reduce((map, productId) => {
    map[productId] = {
      "one-time": UNAVAILABLE_PRICE_QUOTE,
      subscription: UNAVAILABLE_PRICE_QUOTE,
    };
    return map;
  }, {} as ProductPricingMap);
}

export function getPriceQuote(
  pricing: ProductPricingMap,
  productId: ProductId,
  purchaseType: PurchaseType
): PriceQuote {
  return pricing[productId][purchaseType];
}

export function getUnitPrice(
  pricing: ProductPricingMap,
  productId: ProductId,
  purchaseType: PurchaseType
): number {
  return getPriceQuote(pricing, productId, purchaseType).amount;
}

export function getPriceLabel(
  pricing: ProductPricingMap,
  productId: ProductId,
  purchaseType: PurchaseType
): string {
  return getPriceQuote(pricing, productId, purchaseType).label;
}

export function formatStripeAmount(unitAmount: number, currency: string): string {
  const amount = unitAmount / 100;
  if (currency.toLowerCase() !== "usd") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  }
  return formatPrice(amount);
}

export function getSubscriptionSavingsLabel(
  pricing: ProductPricingMap,
  productId: ProductId
): string {
  const oneTime = getUnitPrice(pricing, productId, "one-time");
  const subscription = getUnitPrice(pricing, productId, "subscription");

  if (oneTime <= 0 || subscription <= 0 || subscription >= oneTime) {
    return "Subscribe";
  }

  const savingsPercent = Math.round((1 - subscription / oneTime) * 100);
  return savingsPercent > 0 ? `Save ${savingsPercent}%` : "Subscribe";
}

export function isStripeBackedPricing(pricing: ProductPricingMap): boolean {
  return (Object.keys(pricing) as ProductId[]).every((productId) =>
    (["one-time", "subscription"] as PurchaseType[]).every(
      (purchaseType) => pricing[productId][purchaseType].source === "stripe"
    )
  );
}
