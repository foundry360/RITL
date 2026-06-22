"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import type { CartItem } from "@/lib/cart/types";

function isCartItem(value: unknown): value is CartItem {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as CartItem).productId === "string" &&
    typeof (value as CartItem).quantity === "number" &&
    typeof (value as CartItem).purchaseType === "string"
  );
}

export function AbandonedCheckoutRecovery() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { replaceItems, isReady } = useCart();
  const attempted = useRef(false);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    if (!isReady || attempted.current) {
      return;
    }

    const recover = searchParams.get("recover")?.trim();
    const token = searchParams.get("token")?.trim();
    if (!recover || !token) {
      return;
    }

    attempted.current = true;
    setRecovering(true);

    void (async () => {
      try {
        const params = new URLSearchParams({ recover, token });
        const response = await fetch(
          `/api/abandoned-checkout/recover?${params.toString()}`
        );

        if (response.ok) {
          const data = (await response.json()) as { items?: unknown };
          const items = Array.isArray(data.items)
            ? data.items.filter(isCartItem)
            : [];

          if (items.length > 0) {
            replaceItems(items);
          }
        }
      } catch (error) {
        console.error("Abandoned checkout recovery failed:", error);
      } finally {
        setRecovering(false);
        router.replace(pathname, { scroll: false });
      }
    })();
  }, [isReady, pathname, replaceItems, router, searchParams]);

  if (!recovering) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 top-24 z-40 px-6"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto max-w-lg rounded-[8px] border border-graphite bg-soft-black/95 px-4 py-3 text-center text-sm text-text-secondary">
        Restoring your cart...
      </div>
    </div>
  );
}
