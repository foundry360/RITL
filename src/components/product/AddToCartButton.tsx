"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductId, PurchaseType } from "@/lib/stripe/products";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  productId: ProductId;
  quantity?: number;
  purchaseType?: PurchaseType;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "outline" | "ghost";
  redirectToCart?: boolean;
}

export function AddToCartButton({
  productId,
  quantity = 1,
  purchaseType = "one-time",
  label = "Add to Cart",
  className,
  size = "md",
  variant = "outline",
  redirectToCart = false,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  const handleClick = useCallback(() => {
    addItem(productId, quantity, purchaseType);
    setAdded(true);

    if (redirectToCart) {
      router.push("/cart");
      return;
    }

    window.setTimeout(() => setAdded(false), 1500);
  }, [addItem, productId, quantity, purchaseType, redirectToCart, router]);

  return (
    <Button
      onClick={handleClick}
      className={cn(className)}
      size={size}
      variant={variant}
    >
      {added ? "Added" : label}
    </Button>
  );
}
