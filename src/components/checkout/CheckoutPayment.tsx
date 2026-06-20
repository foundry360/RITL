"use client";

import { useEffect, useMemo, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { CustomPaymentForm } from "@/components/checkout/CustomPaymentForm";
import type { CheckoutLineItem } from "@/components/checkout/CheckoutOrderSummary";
import {
  getCheckoutItemsKey,
  getCheckoutReference,
  getCheckoutSessionKey,
  readCachedCheckout,
  writeCachedCheckout,
} from "@/lib/checkout/session";
import { getStripeClient } from "@/lib/stripe/client";
import { stripeElementsAppearance, stripeElementsFonts } from "@/lib/stripe/elements-appearance";
import { Button } from "@/components/ui/Button";

interface CheckoutPaymentProps {
  items: CheckoutLineItem[];
  cancelHref?: string;
  promoCode?: string;
}

interface CheckoutPaymentState {
  clientSecret: string;
  mode: "payment" | "subscription";
  customerId: string;
  email: string;
  promoCode?: string;
}

export function CheckoutPayment({
  items,
  cancelHref = "/cart",
  promoCode,
}: CheckoutPaymentProps) {
  const [paymentState, setPaymentState] = useState<CheckoutPaymentState | null>(
    null
  );
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkoutItems = useMemo(
    () => items.map((item) => ({ ...item })),
    [items]
  );
  const itemsKey = useMemo(
    () => getCheckoutItemsKey(checkoutItems),
    [checkoutItems]
  );
  const sessionKey = useMemo(
    () => getCheckoutSessionKey(itemsKey, promoCode),
    [itemsKey, promoCode]
  );

  useEffect(() => {
    const cached = readCachedCheckout(sessionKey);
    if (
      cached?.customerId &&
      cached.email &&
      (cached.promoCode ?? "") === (promoCode?.trim().toUpperCase() ?? "")
    ) {
      setPaymentState(cached);
      setEmail(cached.email);
      return;
    }

    setPaymentState(null);
  }, [sessionKey, promoCode]);

  async function initializePayment(checkoutEmail: string) {
    setIsLoading(true);
    setError(null);

    try {
      const checkoutReference = getCheckoutReference(sessionKey);
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: checkoutItems,
          checkoutReference,
          email: checkoutEmail,
          ...(promoCode ? { promoCode } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize payment");
      }

      const nextState: CheckoutPaymentState = {
        clientSecret: data.clientSecret,
        mode: data.mode,
        customerId: data.customerId,
        email: checkoutEmail,
        promoCode: promoCode?.trim().toUpperCase(),
      };

      writeCachedCheckout(sessionKey, nextState);
      setPaymentState(nextState);
      setEmail(checkoutEmail);
    } catch (initializationError) {
      setError(
        initializationError instanceof Error
          ? initializationError.message
          : "Failed to initialize payment"
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (!paymentState?.clientSecret || !paymentState.customerId) {
    return (
      <div className="rounded-[8px] border border-graphite bg-soft-black/40 p-8">
        <div className="space-y-3">
          <h3 className="text-[10px] tracking-[0.18em] uppercase text-text-muted">
            Contact
          </h3>
          <div className="space-y-2">
            <label
              htmlFor="checkout-email"
              className="block text-[10px] tracking-[0.14em] uppercase text-text-muted"
            >
              Email
            </label>
            <input
              id="checkout-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-[8px] border border-graphite bg-[#16181d] px-3 py-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-steel-silver/50"
              placeholder="you@example.com"
            />
          </div>
          <p className="text-xs text-text-muted">
            We use your email to link orders to one account and send receipts.
          </p>
        </div>

        {error && (
          <p className="mt-4 text-sm text-text-secondary">{error}</p>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            size="lg"
            disabled={isLoading || !email.trim()}
            onClick={() => initializePayment(email.trim())}
          >
            {isLoading ? "Preparing secure payment..." : "Continue to Payment"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Elements
      stripe={getStripeClient()}
      options={{
        clientSecret: paymentState.clientSecret,
        appearance: stripeElementsAppearance,
        fonts: stripeElementsFonts,
      }}
    >
      <CustomPaymentForm
        cancelHref={cancelHref}
        customerId={paymentState.customerId}
        clientSecret={paymentState.clientSecret}
        mode={paymentState.mode}
        email={paymentState.email}
      />
    </Elements>
  );
}
