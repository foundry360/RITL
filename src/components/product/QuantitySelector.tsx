"use client";

import { cn } from "@/lib/utils";

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 99;

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  className?: string;
}

export function QuantitySelector({
  value,
  onChange,
  label = "Quantity",
  className,
}: QuantitySelectorProps) {
  const decrease = () => onChange(Math.max(MIN_QUANTITY, value - 1));
  const increase = () => onChange(Math.min(MAX_QUANTITY, value + 1));

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-[10px] tracking-[0.18em] uppercase text-text-muted">
        {label}
      </p>
      <div className="inline-flex items-center rounded-[8px] border border-graphite">
        <button
          type="button"
          onClick={decrease}
          disabled={value <= MIN_QUANTITY}
          className="px-4 py-3 text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="min-w-12 px-2 py-3 text-center text-sm tabular-nums text-text-primary">
          {value}
        </span>
        <button
          type="button"
          onClick={increase}
          disabled={value >= MAX_QUANTITY}
          className="px-4 py-3 text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
    </div>
  );
}
