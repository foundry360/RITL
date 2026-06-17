"use client";

import { useCallback, useState } from "react";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { getStripeClient } from "@/lib/stripe/client";
import type { ProductId } from "@/lib/stripe/products";

interface CheckoutItem {
  productId: ProductId;
  quantity: number;
}

interface EmbeddedCheckoutFormProps {
  productId?: ProductId;
  items?: CheckoutItem[];
}

export function EmbeddedCheckoutForm({
  productId,
  items,
}: EmbeddedCheckoutFormProps) {
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    const body = items?.length ? { items } : { productId };

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Failed to initialize checkout");
      throw new Error(data.error || "Failed to initialize checkout");
    }

    return data.clientSecret as string;
  }, [items, productId]);

  if (error) {
    return (
      <div className="border border-graphite p-8 text-center">
        <p className="text-sm text-text-secondary">{error}</p>
        <p className="mt-2 text-xs text-text-muted">
          Ensure Stripe keys are configured in your environment variables.
        </p>
      </div>
    );
  }

  return (
    <EmbeddedCheckoutProvider
      stripe={getStripeClient()}
      options={{ fetchClientSecret }}
    >
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
}
