"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductId } from "@/lib/stripe/products";
import { Button } from "@/components/ui/Button";

interface CheckoutButtonProps {
  productId: ProductId;
  label?: string;
  className?: string;
}

export function CheckoutButton({
  productId,
  label = "Buy Now",
  className,
}: CheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCheckout = useCallback(() => {
    setLoading(true);
    router.push(`/checkout/${productId}`);
  }, [productId, router]);

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
