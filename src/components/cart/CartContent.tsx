"use client";

import Link from "next/link";
import { useMemo } from "react";
import { EmbeddedCheckoutForm } from "@/components/product/EmbeddedCheckoutForm";
import { ButtonLink } from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import { getProduct } from "@/lib/stripe/products";

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CartContent() {
  const { items, subtotal, isReady, updateQuantity, removeItem } = useCart();

  const checkoutItems = useMemo(
    () => items.map((item) => ({ ...item })),
    [items]
  );

  if (!isReady) {
    return (
      <div className="border border-graphite p-8 text-center">
        <p className="text-sm text-text-secondary">Loading cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="border border-graphite p-10 text-center">
        <p className="text-sm text-text-secondary">Your cart is empty.</p>
        <div className="mt-6">
          <ButtonLink href="/#products">Shop Products</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="border border-graphite">
        <ul className="divide-y divide-graphite">
          {items.map((item) => {
            const product = getProduct(item.productId);
            if (!product) return null;

            return (
              <li
                key={item.productId}
                className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link
                    href={`/products/${product.id}`}
                    className="text-lg font-light tracking-tight text-text-primary transition-colors hover:text-steel-silver"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 text-sm text-text-muted">
                    {product.priceLabel} each
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center border border-graphite">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1)
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
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                      className="px-3 py-2 text-text-secondary transition-colors hover:text-text-primary"
                      aria-label={`Increase quantity of ${product.name}`}
                    >
                      +
                    </button>
                  </div>

                  <p className="min-w-16 text-right text-sm text-text-primary tabular-nums">
                    {formatPrice(product.price * item.quantity)}
                  </p>

                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
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
          <span className="text-lg font-light text-text-primary tabular-nums">
            {formatPrice(subtotal)}
          </span>
        </div>
      </div>

      <div>
        <p className="text-xs tracking-[0.2em] uppercase text-text-muted">
          Secure Checkout
        </p>
        <div className="mt-6">
          <EmbeddedCheckoutForm items={checkoutItems} />
        </div>
      </div>
    </div>
  );
}
