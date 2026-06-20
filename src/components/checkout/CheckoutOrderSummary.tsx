"use client";

import Link from "next/link";
import { OrderLineItemThumbnail } from "@/components/checkout/OrderLineItemThumbnail";
import type { AppliedPromo } from "@/components/checkout/PromoCodeField";
import { PromoCodeField } from "@/components/checkout/PromoCodeField";
import { usePricing } from "@/context/PricingContext";
import { cartItemKey } from "@/lib/cart/types";
import type { ProductId, PurchaseType } from "@/lib/stripe/products";
import { getProduct } from "@/lib/stripe/products";
import { formatPrice } from "@/lib/checkout/format";

export interface CheckoutLineItem {
  productId: ProductId;
  quantity: number;
  purchaseType?: PurchaseType;
}

interface CheckoutOrderSummaryProps {
  items: CheckoutLineItem[];
  showEditLink?: boolean;
  appliedPromo?: AppliedPromo | null;
  onPromoChange?: (promo: AppliedPromo | null) => void;
}

function getPurchaseTypeLabel(purchaseType: PurchaseType): string {
  return purchaseType === "subscription" ? "Subscription" : "One-time";
}

export function CheckoutOrderSummary({
  items,
  showEditLink = true,
  appliedPromo = null,
  onPromoChange,
}: CheckoutOrderSummaryProps) {
  const { getUnitPrice, getPriceLabel } = usePricing();

  const subtotal = items.reduce((total, item) => {
    if (!getProduct(item.productId)) return total;
    const purchaseType = item.purchaseType ?? "one-time";
    return total + getUnitPrice(item.productId, purchaseType) * item.quantity;
  }, 0);

  const hasSubscription = items.some(
    (item) => (item.purchaseType ?? "one-time") === "subscription"
  );
  const discountAmount = appliedPromo ? appliedPromo.discountCents / 100 : 0;
  const estimatedTotal = appliedPromo
    ? appliedPromo.totalCents / 100
    : subtotal;

  return (
    <div className="rounded-[8px] border border-graphite bg-soft-black/40">
      <div className="flex items-center justify-between border-b border-graphite px-6 py-5">
        <h2 className="text-xs tracking-[0.18em] uppercase text-text-secondary">
          Order Summary
        </h2>
        {showEditLink && (
          <Link
            href="/cart"
            className="text-[10px] tracking-[0.14em] uppercase text-text-muted transition-colors hover:text-text-primary"
          >
            Edit cart
          </Link>
        )}
      </div>

      <ul className="divide-y divide-graphite">
        {items.map((item) => {
          const product = getProduct(item.productId);
          if (!product) return null;

          const purchaseType = item.purchaseType ?? "one-time";
          const unitPrice = getUnitPrice(item.productId, purchaseType);
          const priceLabel = getPriceLabel(item.productId, purchaseType);

          return (
            <li
              key={cartItemKey({ productId: item.productId, purchaseType })}
              className="flex items-start gap-4 px-6 py-5"
            >
              <OrderLineItemThumbnail product={product} />
              <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-light text-text-primary">
                    {product.name}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    Qty {item.quantity} · {priceLabel} each ·{" "}
                    {getPurchaseTypeLabel(purchaseType)}
                  </p>
                  {purchaseType === "subscription" && (
                    <p className="mt-1 text-xs text-text-muted">
                      Delivered every {product.subscriptionIntervalWeeks} weeks
                    </p>
                  )}
                </div>
                <p className="shrink-0 text-sm tabular-nums text-text-primary">
                  {formatPrice(unitPrice * item.quantity)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      {onPromoChange && (
        <PromoCodeField
          items={items}
          appliedPromo={appliedPromo}
          onPromoChange={onPromoChange}
        />
      )}

      <div className="space-y-3 border-t border-graphite px-6 py-5">
        <div className="flex items-center justify-between">
          <span className="text-xs tracking-[0.12em] uppercase text-text-muted">
            Subtotal
          </span>
          <span className="text-sm tabular-nums text-text-primary">
            {formatPrice(subtotal)}
          </span>
        </div>
        {appliedPromo && (
          <div className="flex items-center justify-between">
            <span className="text-xs tracking-[0.12em] uppercase text-text-muted">
              Discount ({appliedPromo.code})
            </span>
            <span className="text-sm tabular-nums text-accent">
              -{formatPrice(discountAmount)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs tracking-[0.12em] uppercase text-text-muted">
            Shipping
          </span>
          <span className="text-xs text-text-secondary">
            Calculated at payment
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-graphite pt-4">
          <span className="text-xs tracking-[0.14em] uppercase text-text-secondary">
            {hasSubscription ? "Due today" : "Estimated total"}
          </span>
          <span className="text-lg font-light tabular-nums text-text-primary">
            {formatPrice(estimatedTotal)}
          </span>
        </div>
      </div>

      <p className="border-t border-graphite px-6 py-4 text-xs leading-relaxed text-text-muted">
        {hasSubscription
          ? "Your subscription renews automatically every 4 weeks. Tax and final shipping are calculated during payment."
          : "Tax and final shipping are calculated during payment. Orders ship within 1 to 2 business days."}
      </p>
    </div>
  );
}
