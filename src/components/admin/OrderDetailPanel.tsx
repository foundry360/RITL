import Link from "next/link";
import type { AdminOrderDetail } from "@/lib/admin/orders";
import { truncateRoastifyOrderId } from "@/lib/admin/format";
import { formatPrice } from "@/lib/checkout/format";
import { cn } from "@/lib/utils";

interface OrderDetailPanelProps {
  order: AdminOrderDetail;
}

function formatOrderDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="text-xs tracking-[0.14em] uppercase text-text-muted">{label}</p>
      <p className="mt-2 whitespace-pre-line text-sm text-text-primary">
        {value?.trim() ? value : "—"}
      </p>
    </div>
  );
}

const tableHeaderClass =
  "px-4 py-3 text-xs tracking-[0.14em] uppercase text-text-muted font-medium";
const tableCellClass = "px-4 py-4 align-top text-sm text-text-secondary";

export function OrderDetailPanel({ order }: OrderDetailPanelProps) {
  const backHref = order.stripeCustomerId
    ? `/admin/customers/${order.stripeCustomerId}`
    : "/admin/orders";
  const backLabel = order.stripeCustomerId ? "← Customer" : "← Orders";

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={backHref}
          className="text-xs tracking-[0.14em] uppercase text-text-muted transition-colors hover:text-text-primary"
        >
          {backLabel}
        </Link>
        <h1 className="mt-6 text-3xl font-light tracking-tight text-text-primary">
          {order.itemsSummary}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-10 lg:gap-10">
        <aside className="space-y-4 lg:col-span-3">
          <h2 className="text-xs tracking-[0.18em] uppercase text-text-muted">
            Order Information
          </h2>
          <section className="rounded-[8px] border border-graphite bg-soft-black/40 p-6">
            <div className="space-y-6">
              <DetailField label="Date" value={formatOrderDate(order.createdAt)} />
              <DetailField label="Total" value={formatPrice(order.amount / 100)} />
              <DetailField label="Progress" value={order.roastifyStatus} />
              <DetailField label="Tracking Number" value={order.trackingNumber} />
              <DetailField label="Carrier" value={order.carrier} />
              <DetailField
                label="Roastify Order ID"
                value={
                  order.roastifyOrderId
                    ? truncateRoastifyOrderId(order.roastifyOrderId)
                    : undefined
                }
              />
              <DetailField label="Stripe Payment ID" value={order.id} />
              <div>
                <p className="text-xs tracking-[0.14em] uppercase text-text-muted">
                  Customer
                </p>
                {order.stripeCustomerId ? (
                  <Link
                    href={`/admin/customers/${order.stripeCustomerId}`}
                    className="mt-2 inline-block text-sm text-text-primary transition-colors hover:text-steel-silver"
                  >
                    {order.customerName}
                  </Link>
                ) : (
                  <p className="mt-2 text-sm text-text-primary">{order.customerName}</p>
                )}
              </div>
              <DetailField label="Customer Email" value={order.customerEmail} />
              <DetailField label="Shipping Address" value={order.shippingAddress} />
            </div>
          </section>
        </aside>

        <section className="space-y-4 lg:col-span-7">
          <h2 className="text-xs tracking-[0.18em] uppercase text-text-muted">
            Items
          </h2>
          {order.lineItems.length === 0 ? (
            <div className="rounded-[8px] border border-graphite bg-soft-black/40 p-10 text-center">
              <p className="text-sm text-text-secondary">
                No line items recorded for this order.
              </p>
            </div>
          ) : (
            <div className="rounded-[8px] border border-graphite bg-soft-black/40">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-graphite">
                    <th className={tableHeaderClass}>Product</th>
                    <th className={tableHeaderClass}>Type</th>
                    <th className={tableHeaderClass}>Qty</th>
                    <th className={tableHeaderClass}>Unit Price</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lineItems.map((item, index) => (
                    <tr
                      key={`${item.name}-${index}`}
                      className="border-b border-graphite/60 last:border-b-0"
                    >
                      <td className={`${tableCellClass} text-text-primary`}>
                        {item.name}
                      </td>
                      <td className={tableCellClass}>
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-[10px] tracking-[0.12em] uppercase",
                            "bg-steel-silver/15 text-text-primary"
                          )}
                        >
                          {item.purchaseType === "subscription"
                            ? "Subscription"
                            : "One-time"}
                        </span>
                      </td>
                      <td className={tableCellClass}>{item.quantity}</td>
                      <td className={`${tableCellClass} text-text-primary`}>
                        {item.unitLabel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {order.trackingUrl ? (
            <a
              href={order.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-sm text-text-primary transition-colors hover:text-steel-silver"
            >
              Track shipment →
            </a>
          ) : null}
        </section>
      </div>
    </div>
  );
}
