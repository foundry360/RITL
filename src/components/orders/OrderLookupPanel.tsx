"use client";

import { useState } from "react";
import Link from "next/link";
import { FulfillmentProgressSteps } from "@/components/admin/FulfillmentProgressSteps";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/checkout/format";
import type { PublicOrderStatus } from "@/lib/orders/guest-lookup";
import { CONTACT_INBOX } from "@/lib/contact/config";

const inputClassName =
  "w-full rounded-[8px] border border-graphite bg-near-black px-4 py-3 text-sm text-text-primary outline-none transition-colors focus:border-steel-silver/50";

function formatOrderDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function OrderLookupPanel() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<PublicOrderStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setOrder(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          orderNumber: orderNumber.trim(),
        }),
      });

      const data = (await response.json()) as {
        order?: PublicOrderStatus;
        error?: string;
      };

      if (!response.ok) {
        setError(
          data.error ??
            "We couldn't find an order matching those details. Check your confirmation email and try again."
        );
        return;
      }

      setOrder(data.order ?? null);
    } catch {
      setError("Unable to look up your order right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setOrder(null);
    setError(null);
  }

  if (order) {
    return (
      <div className="space-y-6">
        <div className="rounded-[8px] border border-graphite bg-soft-black/40 p-8">
          <div className="flex flex-col gap-4 border-b border-graphite pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs tracking-[0.18em] uppercase text-text-muted">
                Order found
              </p>
              <h2 className="mt-2 text-2xl font-light tracking-tight text-text-primary">
                {order.customerName}
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                Placed {formatOrderDate(order.orderDate)}
              </p>
            </div>
            <FulfillmentProgressSteps status={order.fulfillmentStatus} />
          </div>

          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-[10px] tracking-[0.14em] uppercase text-text-muted">
                Order reference
              </dt>
              <dd className="mt-1 text-sm text-text-primary">{order.orderReference}</dd>
            </div>
            <div>
              <dt className="text-[10px] tracking-[0.14em] uppercase text-text-muted">
                Total
              </dt>
              <dd className="mt-1 text-sm tabular-nums text-text-primary">
                {formatPrice(order.amount)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[10px] tracking-[0.14em] uppercase text-text-muted">
                Items
              </dt>
              <dd className="mt-1 text-sm text-text-primary">{order.itemsSummary}</dd>
            </div>
            {order.trackingNumber ? (
              <div className="sm:col-span-2">
                <dt className="text-[10px] tracking-[0.14em] uppercase text-text-muted">
                  Tracking
                </dt>
                <dd className="mt-1 text-sm text-text-primary">
                  {order.carrier ? `${order.carrier} · ` : ""}
                  {order.trackingUrl ? (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-steel-silver transition-colors hover:text-text-primary"
                    >
                      {order.trackingNumber}
                    </a>
                  ) : (
                    order.trackingNumber
                  )}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={handleReset}>
            Look up another order
          </Button>
          <Link
            href="/support"
            className="inline-flex items-center justify-center rounded-[8px] border border-graphite bg-transparent px-6 py-3 text-xs tracking-[0.14em] uppercase text-text-primary transition-colors hover:border-steel-silver/40 hover:bg-graphite/50"
          >
            Contact support
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[8px] border border-graphite bg-soft-black/40 p-8"
    >
      <p className="text-sm leading-relaxed text-text-secondary">
        Enter the email, name, and order reference from your confirmation email.
        No account is required.
      </p>

      <div className="mt-8 space-y-5">
        <label className="block">
          <span className="mb-2 block text-xs tracking-[0.14em] uppercase text-text-muted">
            Email
          </span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClassName}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs tracking-[0.14em] uppercase text-text-muted">
            Name
          </span>
          <input
            type="text"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClassName}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs tracking-[0.14em] uppercase text-text-muted">
            Order number
          </span>
          <input
            type="text"
            name="orderNumber"
            required
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value)}
            placeholder="e.g. pi_..."
            className={inputClassName}
          />
          <span className="mt-2 block text-xs text-text-muted">
            Use the order reference from your confirmation email.
          </span>
        </label>
      </div>

      {error ? (
        <p className="mt-5 text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-8">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Searching..." : "Find my order"}
        </Button>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-text-muted">
        Need help? Email{" "}
        <a
          href={`mailto:${CONTACT_INBOX}`}
          className="text-text-secondary transition-colors hover:text-text-primary"
        >
          {CONTACT_INBOX}
        </a>
        .
      </p>
    </form>
  );
}
