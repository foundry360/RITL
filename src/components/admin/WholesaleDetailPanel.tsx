import Link from "next/link";
import type { AdminWholesaleOrderDetail } from "@/lib/admin/wholesale";
import { truncateRoastifyOrderId } from "@/lib/admin/format";

interface WholesaleDetailPanelProps {
  order: AdminWholesaleOrderDetail;
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

export function WholesaleDetailPanel({ order }: WholesaleDetailPanelProps) {
  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/wholesale"
          className="text-xs tracking-[0.14em] uppercase text-text-muted transition-colors hover:text-text-primary"
        >
          ← Wholesale
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
              <DetailField label="Customer" value={order.customerName} />
              <DetailField label="Email" value={order.customerEmail} />
              <DetailField label="Company" value={order.company} />
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
              {order.externalSourceId ? (
                <DetailField
                  label="External Source ID"
                  value={order.externalSourceId}
                />
              ) : null}
            </div>
          </section>
        </aside>

        <div className="space-y-8 lg:col-span-7">
          <section className="rounded-[8px] border border-graphite bg-soft-black/40 p-6">
            <h2 className="text-xs tracking-[0.18em] uppercase text-text-muted">
              Shipping Address
            </h2>
            <p className="mt-4 whitespace-pre-line text-sm text-text-primary">
              {order.shippingAddress?.trim() ? order.shippingAddress : "—"}
            </p>
          </section>

          <section className="rounded-[8px] border border-graphite bg-soft-black/40">
            <h2 className="border-b border-graphite px-6 py-4 text-xs tracking-[0.18em] uppercase text-text-muted">
              Line Items
            </h2>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-graphite">
                  <th className={tableHeaderClass}>SKU</th>
                  <th className={tableHeaderClass}>Qty</th>
                </tr>
              </thead>
              <tbody>
                {order.lineItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className={`${tableCellClass} py-8 text-center text-text-muted`}
                    >
                      No line items returned from Roastify.
                    </td>
                  </tr>
                ) : (
                  order.lineItems.map((item, index) => (
                    <tr
                      key={`${item.sku}-${index}`}
                      className="border-b border-graphite/60 last:border-b-0"
                    >
                      <td className={tableCellClass}>{item.sku}</td>
                      <td className={tableCellClass}>{item.quantity}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          {order.trackingUrl ? (
            <a
              href={order.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-sm text-steel-silver transition-colors hover:text-text-primary"
            >
              Track shipment →
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
