"use client";

import { useState } from "react";
import type { CheckoutLineItem } from "@/components/checkout/CheckoutOrderSummary";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/checkout/format";

export interface AppliedPromo {
  code: string;
  percentOff: number | null;
  discountCents: number;
  subtotalCents: number;
  totalCents: number;
}

interface PromoCodeFieldProps {
  items: CheckoutLineItem[];
  appliedPromo: AppliedPromo | null;
  onPromoChange: (promo: AppliedPromo | null) => void;
}

export function PromoCodeField({
  items,
  appliedPromo,
  onPromoChange,
}: PromoCodeFieldProps) {
  const [code, setCode] = useState(appliedPromo?.code ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  async function handleApply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Enter a promo code.");
      return;
    }

    setIsApplying(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: trimmed,
          items,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid promo code");
      }

      onPromoChange({
        code: data.code,
        percentOff: data.percentOff,
        discountCents: data.discountCents,
        subtotalCents: data.subtotalCents,
        totalCents: data.totalCents,
      });
      setCode(data.code);
    } catch (applyError) {
      onPromoChange(null);
      setError(
        applyError instanceof Error
          ? applyError.message
          : "Invalid promo code"
      );
    } finally {
      setIsApplying(false);
    }
  }

  function handleRemove() {
    setCode("");
    setError(null);
    onPromoChange(null);
  }

  return (
    <div className="border-t border-graphite px-6 py-5">
      {appliedPromo ? (
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.12em] uppercase text-text-muted">
              Promo applied
            </p>
            <p className="mt-1 text-sm text-text-primary">{appliedPromo.code}</p>
            <p className="mt-1 text-xs text-text-secondary">
              {appliedPromo.percentOff
                ? `${appliedPromo.percentOff}% off`
                : `${formatPrice(appliedPromo.discountCents / 100)} off`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-[10px] tracking-[0.14em] uppercase text-text-muted transition-colors hover:text-text-primary"
          >
            Remove
          </button>
        </div>
      ) : (
        <form onSubmit={handleApply} className="space-y-3">
          <label
            htmlFor="checkout-promo-code"
            className="block text-xs tracking-[0.12em] uppercase text-text-muted"
          >
            Promo code
          </label>
          <div className="flex gap-2">
            <input
              id="checkout-promo-code"
              type="text"
              autoComplete="off"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              className="min-w-0 flex-1 rounded-[8px] border border-graphite bg-near-black px-3 py-2.5 text-sm uppercase text-text-primary outline-none transition-colors placeholder:normal-case placeholder:text-text-muted focus:border-steel-silver/50"
              placeholder="10OFF"
            />
            <Button
              type="submit"
              variant="outline"
              size="md"
              disabled={isApplying || !code.trim()}
            >
              {isApplying ? "Applying..." : "Apply"}
            </Button>
          </div>
          {error && <p className="text-xs text-text-secondary">{error}</p>}
        </form>
      )}
    </div>
  );
}
