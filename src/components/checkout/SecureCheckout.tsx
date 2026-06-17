"use client";

import { useMemo } from "react";
import { CheckoutOrderSummary } from "@/components/checkout/CheckoutOrderSummary";
import { CheckoutPayment } from "@/components/checkout/CheckoutPayment";
import type { CheckoutLineItem } from "@/components/checkout/CheckoutOrderSummary";

interface SecureCheckoutProps {
  items: CheckoutLineItem[];
  showEditLink?: boolean;
  cancelHref?: string;
}

export function SecureCheckout({
  items,
  showEditLink = true,
  cancelHref = "/cart",
}: SecureCheckoutProps) {
  const checkoutItems = useMemo(
    () => items.map((item) => ({ ...item })),
    [items]
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12 lg:items-start">
      <CheckoutOrderSummary items={items} showEditLink={showEditLink} />

      <div className="rounded-[8px] border border-graphite bg-soft-black/40 p-6 sm:p-8">
        <div className="border-b border-graphite pb-6">
          <h2 className="text-xs tracking-[0.18em] uppercase text-text-secondary">
            Payment
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-text-muted">
            Enter your shipping and payment details below. All transactions are
            processed securely through Stripe.
          </p>
        </div>

        <div className="pt-6">
          <CheckoutPayment items={checkoutItems} cancelHref={cancelHref} />
        </div>
      </div>
    </div>
  );
}
