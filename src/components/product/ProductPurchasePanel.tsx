"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { CheckoutButton } from "@/components/product/CheckoutButton";
import { PurchaseTypeSelector } from "@/components/product/PurchaseTypeSelector";
import { QuantitySelector } from "@/components/product/QuantitySelector";
import { ButtonLink } from "@/components/ui/Button";
import { usePricing } from "@/context/PricingContext";
import type { Product, PurchaseType } from "@/lib/stripe/products";

interface ProductPurchasePanelProps {
  product: Product;
}

export function ProductPurchasePanel({ product }: ProductPurchasePanelProps) {
  const [purchaseType, setPurchaseType] = useState<PurchaseType>("one-time");
  const [quantity, setQuantity] = useState(1);
  const { getPriceLabel, getSubscriptionSavingsLabel, isReady } = usePricing();
  const priceLabel = getPriceLabel(product.id, purchaseType);
  const subscriptionPriceLabel = getPriceLabel(product.id, "subscription");
  const subscriptionSavingsLabel = getSubscriptionSavingsLabel(product.id);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-2xl font-light text-text-secondary tabular-nums">
          {isReady ? priceLabel : "—"}
          {purchaseType === "subscription" && (
            <span className="ml-2 text-sm text-text-muted">/ delivery</span>
          )}
        </p>
        {purchaseType === "subscription" && (
          <p className="mt-2 text-xs text-text-muted">
            {subscriptionPriceLabel} every {product.subscriptionIntervalWeeks}{" "}
            weeks. Pause or cancel anytime.
          </p>
        )}
      </div>

      <PurchaseTypeSelector
        value={purchaseType}
        onChange={setPurchaseType}
        subscriptionSavingsLabel={subscriptionSavingsLabel}
      />

      {purchaseType === "one-time" && (
        <QuantitySelector value={quantity} onChange={setQuantity} />
      )}

      <div className="flex flex-wrap gap-3">
        <AddToCartButton
          productId={product.id}
          purchaseType={purchaseType}
          quantity={purchaseType === "one-time" ? quantity : 1}
        />
        <CheckoutButton
          productId={product.id}
          purchaseType={purchaseType}
          quantity={purchaseType === "one-time" ? quantity : 1}
        />
        <ButtonLink href="/#products" variant="outline">
          Continue Shopping
        </ButtonLink>
      </div>
    </div>
  );
}
