"use client";

import { useEffect } from "react";
import { clearCheckoutSession } from "@/lib/checkout/session";
import { useCart } from "@/context/CartContext";

export function ClearCheckoutSession() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCheckoutSession();
    clearCart();
  }, [clearCart]);

  return null;
}
