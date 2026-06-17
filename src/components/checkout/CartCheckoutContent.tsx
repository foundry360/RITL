"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SecureCheckout } from "@/components/checkout/SecureCheckout";
import { useCart } from "@/context/CartContext";

export function CartCheckoutContent() {
  const router = useRouter();
  const { items, isReady } = useCart();

  useEffect(() => {
    if (isReady && items.length === 0) {
      router.replace("/cart");
    }
  }, [isReady, items.length, router]);

  if (!isReady) {
    return (
      <div className="rounded-[8px] border border-graphite bg-soft-black/40 p-12 text-center">
        <p className="text-sm text-text-secondary">Preparing secure checkout...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return <SecureCheckout items={items} />;
}
