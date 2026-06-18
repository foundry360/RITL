import Link from "next/link";
import type { AdminCustomerDetail } from "@/lib/admin/customers";
import { formatAdminCustomerAddress } from "@/lib/admin/customers";
import {
  filterCurrentRoastifyOrders,
  filterShippedRoastifyOrders,
} from "@/lib/admin/orders";
import { AdminOrderHistoryTable } from "@/components/admin/AdminOrderHistoryTable";
import { formatPrice } from "@/lib/checkout/format";

interface CustomerDetailPanelProps {
  customer: AdminCustomerDetail;
}

function formatCustomerDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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

export function CustomerDetailPanel({ customer }: CustomerDetailPanelProps) {
  const billingAddress = formatAdminCustomerAddress(customer.billingAddress);
  const shippingAddress = formatAdminCustomerAddress(customer.shippingAddress);
  const totalSpent = customer.orders.reduce((sum, order) => sum + order.amount, 0);
  const currentOrders = filterCurrentRoastifyOrders(customer.orders);
  const shippedOrders = filterShippedRoastifyOrders(customer.orders);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/customers"
          className="text-xs tracking-[0.14em] uppercase text-text-muted transition-colors hover:text-text-primary"
        >
          ← Customers
        </Link>
        <h1 className="mt-6 text-3xl font-light tracking-tight text-text-primary">
          {customer.name}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-10">
        <aside className="space-y-4">
          <h2 className="text-xs tracking-[0.18em] uppercase text-text-muted">
            Customer Information
          </h2>
          <section className="rounded-[8px] border border-graphite bg-soft-black/40 p-6">
            <div className="space-y-6">
              <DetailField label="Name" value={customer.name} />
              <DetailField label="Email" value={customer.email} />
              <DetailField label="Phone" value={customer.phone} />
              <DetailField
                label="Customer Since"
                value={formatCustomerDate(customer.createdAt)}
              />
              <DetailField label="Total Orders" value={String(customer.orders.length)} />
              <DetailField
                label="Lifetime Value"
                value={formatPrice(totalSpent / 100)}
              />
              <DetailField label="Billing Address" value={billingAddress} />
              <DetailField label="Shipping Address" value={shippingAddress} />
              <DetailField label="Stripe ID" value={customer.id} />
            </div>
          </section>
        </aside>

        <section className="min-w-0 space-y-8">
          <div className="space-y-4">
            <h2 className="text-xs tracking-[0.18em] uppercase text-text-muted">
              Current Order
            </h2>
            <AdminOrderHistoryTable
              orders={currentOrders}
              emptyMessage="No orders in fulfillment."
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-xs tracking-[0.18em] uppercase text-text-muted">
              Order History
            </h2>
            <AdminOrderHistoryTable
              orders={shippedOrders}
              alwaysShowTable
              emptyMessage="No shipped orders yet."
            />
          </div>
        </section>
      </div>
    </div>
  );
}
