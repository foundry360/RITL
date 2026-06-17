"use client";

import { cn } from "@/lib/utils";
import type { PurchaseType } from "@/lib/stripe/products";

interface PurchaseTypeSelectorProps {
  value: PurchaseType;
  onChange: (value: PurchaseType) => void;
  subscriptionSavingsLabel?: string;
  className?: string;
}

export function PurchaseTypeSelector({
  value,
  onChange,
  subscriptionSavingsLabel = "Save 15%",
  className,
}: PurchaseTypeSelectorProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-[10px] tracking-[0.18em] uppercase text-text-muted">
        Purchase option
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange("one-time")}
          className={cn(
            "rounded-[8px] border px-4 py-3 text-left transition-colors",
            value === "one-time"
              ? "border-steel-silver/50 bg-steel-silver/10"
              : "border-graphite bg-transparent hover:border-graphite/80"
          )}
        >
          <span className="block text-xs tracking-[0.12em] uppercase text-text-primary">
            One-time
          </span>
          <span className="mt-1 block text-[10px] text-text-muted">
            Single purchase
          </span>
        </button>
        <button
          type="button"
          onClick={() => onChange("subscription")}
          className={cn(
            "rounded-[8px] border px-4 py-3 text-left transition-colors",
            value === "subscription"
              ? "border-steel-silver/50 bg-steel-silver/10"
              : "border-graphite bg-transparent hover:border-graphite/80"
          )}
        >
          <span className="block text-xs tracking-[0.12em] uppercase text-text-primary">
            Subscribe
          </span>
          <span className="mt-1 block text-[10px] text-text-muted">
            {subscriptionSavingsLabel} · every 4 weeks
          </span>
        </button>
      </div>
    </div>
  );
}
