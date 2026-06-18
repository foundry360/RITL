"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

export function SubmitOrderFulfillment() {
  const searchParams = useSearchParams();
  const submittedRef = useRef(false);

  useEffect(() => {
    const paymentIntentId = searchParams.get("payment_intent");
    if (!paymentIntentId || submittedRef.current) {
      return;
    }

    submittedRef.current = true;

    void fetch("/api/fulfillment/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId }),
    }).catch((error) => {
      console.error("Fulfillment submit failed:", error);
    });
  }, [searchParams]);

  return null;
}
