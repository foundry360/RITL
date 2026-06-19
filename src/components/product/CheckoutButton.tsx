"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductId, PurchaseType } from "@/lib/stripe/products";
import { Button } from "@/components/ui/Button";

interface CheckoutButtonProps {
  productId: ProductId;
  purchaseType?: PurchaseType;
  quantity?: number;
  label?: string;
  className?: string;
}

export function CheckoutButton({
  productId,
  purchaseType = "one-time",
  quantity = 1,
  label = "Buy Now",
  className,
}: CheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCheckout = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ purchaseType });
    if (quantity > 1) {
      params.set("quantity", String(Math.min(99, Math.floor(quantity))));
    }
    router.push(`/checkout/${productId}?${params.toString()}`);
  }, [productId, purchaseType, quantity, router]);

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      className={className}
    >
      {loading ? "Loading..." : label}
    </Button>
  );
}
