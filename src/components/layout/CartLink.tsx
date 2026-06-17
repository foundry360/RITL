"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";

interface CartLinkProps {
  className?: string;
}

export function CartLink({ className }: CartLinkProps) {
  const { itemCount, isReady } = useCart();

  return (
    <Link
      href="/cart"
      className={cn(
        "relative inline-flex items-center justify-center rounded-[4px] border border-graphite px-3 py-2 text-text-muted transition-all hover:border-steel-silver/40 hover:text-text-primary",
        className
      )}
      aria-label={`Cart${itemCount > 0 ? `, ${itemCount} items` : ""}`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden
      >
        <path
          d="M6 6h12l-1.5 8H7.5L6 6z"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path
          d="M6 6 5 3H2"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="17" r="1" fill="currentColor" />
        <circle cx="15" cy="17" r="1" fill="currentColor" />
      </svg>
      {isReady && itemCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-steel-silver px-1 text-[9px] font-medium text-near-black">
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      )}
    </Link>
  );
}
