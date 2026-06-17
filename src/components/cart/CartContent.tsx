"use client";

import Link from "next/link";
import { OrderLineItemThumbnail } from "@/components/checkout/OrderLineItemThumbnail";
import { ButtonLink } from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import { usePricing } from "@/context/PricingContext";
import { cartItemKey } from "@/lib/cart/types";
import { getProduct } from "@/lib/stripe/products";
import { formatPrice } from "@/lib/checkout/format";

export function CartContent() {
  const { items, subtotal, isReady, updateQuantity, removeItem } = useCart();
  const { getUnitPrice, getPriceLabel } = usePricing();

  if (!isReady) {
    return (
      <div className="rounded-[8px] border border-graphite bg-soft-black/40 p-12 text-center">
        <p className="text-sm text-text-secondary">Loading cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[8px] border border-graphite bg-soft-black/40 p-12 text-center">
        <p className="text-sm text-text-secondary">Your cart is empty.</p>
        <div className="mt-6">
          <ButtonLink href="/#products">Shop Products</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[8px] border border-graphite bg-soft-black/40">
      <ul className="divide-y divide-graphite">
        {items.map((item) => {
          const product = getProduct(item.productId);
          if (!product) return null;

          const unitPrice = getUnitPrice(item.productId, item.purchaseType);
          const priceLabel = getPriceLabel(item.productId, item.purchaseType);

          return (
            <li
              key={cartItemKey(item)}
              className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <OrderLineItemThumbnail product={product} />
                <div>
                  <Link
                    href={`/products/${product.id}`}
                    className="text-lg font-light tracking-tight text-text-primary transition-colors hover:text-steel-silver"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 text-sm text-text-muted">
                    {priceLabel} each ·{" "}
                    {item.purchaseType === "subscription"
                      ? "Subscription"
                      : "One-time"}
                  </p>
                  {item.purchaseType === "subscription" && (
                    <p className="mt-1 text-xs text-text-muted">
                      Every {product.subscriptionIntervalWeeks} weeks
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center rounded-[8px] border border-graphite">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(
                        item.productId,
                        item.purchaseType,
                        item.quantity - 1
                      )
                    }
                    className="px-3 py-2 text-text-secondary transition-colors hover:text-text-primary"
                    aria-label={`Decrease quantity of ${product.name}`}
                  >
                    −
                  </button>
                  <span className="min-w-10 px-2 py-2 text-center text-sm tabular-nums text-text-primary">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(
                        item.productId,
                        item.purchaseType,
                        item.quantity + 1
                      )
                    }
                    className="px-3 py-2 text-text-secondary transition-colors hover:text-text-primary"
                    aria-label={`Increase quantity of ${product.name}`}
                  >
                    +
                  </button>
                </div>

                <p className="min-w-16 text-right text-sm tabular-nums text-text-primary">
                  {formatPrice(unitPrice * item.quantity)}
                </p>

                <button
                  type="button"
                  onClick={() => removeItem(item.productId, item.purchaseType)}
                  className="text-xs tracking-[0.12em] uppercase text-text-muted transition-colors hover:text-text-primary"
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between border-t border-graphite px-6 py-5">
        <span className="text-xs tracking-[0.14em] uppercase text-text-muted">
          Subtotal
        </span>
        <span className="text-lg font-light tabular-nums text-text-primary">
          {formatPrice(subtotal)}
        </span>
      </div>

      <div className="border-t border-graphite px-6 py-6">
        <div className="flex flex-wrap justify-end gap-3">
          <ButtonLink href="/#products" variant="outline" size="lg" className="w-full sm:w-auto">
            Continue Shopping
          </ButtonLink>
          <ButtonLink href="/checkout" size="lg" className="w-full sm:w-auto">
            Proceed to Secure Checkout
          </ButtonLink>
        </div>
        <p className="mt-4 text-right text-xs text-text-muted">
          Shipping and tax calculated at payment. Powered by Stripe.
        </p>
      </div>
    </div>
  );
}
