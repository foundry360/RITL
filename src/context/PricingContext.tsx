"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  buildFallbackPricing,
  getPriceLabel,
  getSubscriptionSavingsLabel,
  getUnitPrice,
  isStripeBackedPricing,
  type ProductPricingMap,
} from "@/lib/stripe/pricing";
import type { ProductId, PurchaseType } from "@/lib/stripe/products";

const PRICING_REFRESH_MS = 60_000;

interface PricingContextValue {
  pricing: ProductPricingMap;
  isReady: boolean;
  isStripeBacked: boolean;
  getUnitPrice: (productId: ProductId, purchaseType: PurchaseType) => number;
  getPriceLabel: (productId: ProductId, purchaseType: PurchaseType) => string;
  getSubscriptionSavingsLabel: (productId: ProductId) => string;
  refreshPricing: () => Promise<void>;
}

const PricingContext = createContext<PricingContextValue | null>(null);

interface PricingProviderProps {
  children: React.ReactNode;
  initialPricing?: ProductPricingMap;
}

export function PricingProvider({
  children,
  initialPricing,
}: PricingProviderProps) {
  const [pricing, setPricing] = useState<ProductPricingMap>(
    initialPricing ?? buildFallbackPricing()
  );
  const [isReady, setIsReady] = useState(Boolean(initialPricing));
  const [isStripeBacked, setIsStripeBacked] = useState(
    initialPricing ? isStripeBackedPricing(initialPricing) : false
  );

  const applyPricing = useCallback((data: ProductPricingMap) => {
    setPricing(data);
    setIsStripeBacked(isStripeBackedPricing(data));
    setIsReady(true);
  }, []);

  const refreshPricing = useCallback(async () => {
    const response = await fetch("/api/catalog/prices", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load catalog prices");
    }

    const data = (await response.json()) as ProductPricingMap;
    applyPricing(data);
  }, [applyPricing]);

  useEffect(() => {
    let cancelled = false;

    async function loadPricing() {
      try {
        await refreshPricing();
      } catch (error) {
        if (!cancelled) {
          console.error("Using fallback pricing:", error);
          setIsReady(true);
        }
      }
    }

    if (!initialPricing) {
      loadPricing();
    }

    const intervalId = window.setInterval(() => {
      refreshPricing().catch((error) => {
        console.error("Failed to refresh pricing:", error);
      });
    }, PRICING_REFRESH_MS);

    const handleFocus = () => {
      refreshPricing().catch((error) => {
        console.error("Failed to refresh pricing:", error);
      });
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [initialPricing, refreshPricing]);

  const value = useMemo(
    () => ({
      pricing,
      isReady,
      isStripeBacked,
      getUnitPrice: (productId: ProductId, purchaseType: PurchaseType) =>
        getUnitPrice(pricing, productId, purchaseType),
      getPriceLabel: (productId: ProductId, purchaseType: PurchaseType) =>
        getPriceLabel(pricing, productId, purchaseType),
      getSubscriptionSavingsLabel: (productId: ProductId) =>
        getSubscriptionSavingsLabel(pricing, productId),
      refreshPricing,
    }),
    [pricing, isReady, isStripeBacked, refreshPricing]
  );

  return (
    <PricingContext.Provider value={value}>{children}</PricingContext.Provider>
  );
}

export function usePricing() {
  const context = useContext(PricingContext);
  if (!context) {
    throw new Error("usePricing must be used within a PricingProvider");
  }
  return context;
}
