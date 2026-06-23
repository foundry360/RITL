"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { AdminOrderRow } from "@/lib/admin/orders";
import { canCancelAdminOrder } from "@/lib/admin/cancel-order";
import { cn } from "@/lib/utils";

interface OrderRowActionsProps {
  order: AdminOrderRow;
  onOrderUpdated: (order: AdminOrderRow) => void;
}

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="3" r="1.25" fill="currentColor" />
      <circle cx="8" cy="8" r="1.25" fill="currentColor" />
      <circle cx="8" cy="13" r="1.25" fill="currentColor" />
    </svg>
  );
}

export function OrderRowActions({ order, onOrderUpdated }: OrderRowActionsProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canCancel = canCancelAdminOrder(order);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  async function handleCancelOrder() {
    if (!canCancel || isCanceling) {
      return;
    }

    const confirmed = window.confirm(
      "Cancel this order in Roastify? This only works while the order is still in Created status."
    );
    if (!confirmed) {
      return;
    }

    setIsCanceling(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/orders/${order.id}/cancel`, {
        method: "POST",
      });
      const data = (await response.json()) as {
        error?: string;
        order?: AdminOrderRow;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to cancel order");
      }

      if (data.order) {
        onOrderUpdated(data.order);
      }

      setIsOpen(false);
    } catch (cancelError) {
      setErrorMessage(
        cancelError instanceof Error
          ? cancelError.message
          : "Failed to cancel order"
      );
    } finally {
      setIsCanceling(false);
    }
  }

  return (
    <div ref={rootRef} className="relative flex justify-end">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={`Actions for order ${order.roastifyOrderId ?? order.id}`}
        onClick={() => {
          setErrorMessage(null);
          setIsOpen((current) => !current);
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-transparent text-text-muted transition-colors hover:border-graphite hover:bg-graphite/30 hover:text-text-primary"
      >
        <MoreIcon />
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[10rem] rounded-[8px] border border-graphite bg-near-black py-1 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
        >
          <button
            type="button"
            role="menuitem"
            disabled={!canCancel || isCanceling}
            onClick={() => void handleCancelOrder()}
            className={cn(
              "block w-full px-3 py-2 text-left text-sm transition-colors",
              canCancel
                ? "text-text-primary hover:bg-graphite/40"
                : "cursor-not-allowed text-text-muted"
            )}
          >
            {isCanceling ? "Canceling..." : "Cancel Order"}
          </button>
          {!canCancel ? (
            <p className="px-3 pb-2 text-xs leading-relaxed text-text-muted">
              Only available while status is Created.
            </p>
          ) : null}
          {errorMessage ? (
            <p className="px-3 pb-2 text-xs leading-relaxed text-red-300">
              {errorMessage}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
