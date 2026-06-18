import Link from "next/link";
import type { AdminOrderRow } from "@/lib/admin/orders";
import { truncateRoastifyOrderId, formatOrderTypeLabel } from "@/lib/admin/format";
import { formatPrice } from "@/lib/checkout/format";
import { cn } from "@/lib/utils";
import {
  orderHistoryColumnWidths,
  orderTableCellClass,
  orderTableClass,
  orderTableHeaderClass,
} from "@/components/admin/orderTable";

const ORDER_HISTORY_COLUMN_COUNT = 7;

function formatOrderDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

function OrderHistoryHeader() {
  return (
    <thead>
      <tr className="border-b border-graphite">
        <th className={cn(orderTableHeaderClass, orderHistoryColumnWidths.items)}>
          Items
        </th>
        <th className={cn(orderTableHeaderClass, orderHistoryColumnWidths.date)}>
          Date
        </th>
        <th className={cn(orderTableHeaderClass, orderHistoryColumnWidths.total)}>
          Total
        </th>
        <th className={cn(orderTableHeaderClass, orderHistoryColumnWidths.type)}>
          Type
        </th>
        <th className={cn(orderTableHeaderClass, orderHistoryColumnWidths.progress)}>
          Progress
        </th>
        <th className={cn(orderTableHeaderClass, orderHistoryColumnWidths.tracking)}>
          Tracking
        </th>
        <th className={cn(orderTableHeaderClass, orderHistoryColumnWidths.orderId)}>
          Order ID
        </th>
      </tr>
    </thead>
  );
}

function OrderHistoryRow({ order }: { order: AdminOrderRow }) {
  return (
    <tr className="border-b border-graphite/60 last:border-b-0 transition-colors hover:bg-graphite/20">
      <td className={`${orderTableCellClass} break-words`}>
        <Link
          href={`/admin/orders/${order.id}`}
          className="text-text-primary transition-colors hover:text-steel-silver"
        >
          {order.itemsSummary}
        </Link>
      </td>
      <td className={`${orderTableCellClass} whitespace-nowrap`}>
        {formatOrderDate(order.createdAt)}
      </td>
      <td className={`${orderTableCellClass} whitespace-nowrap text-text-primary`}>
        {formatPrice(order.amount / 100)}
      </td>
      <td className={`${orderTableCellClass} whitespace-nowrap`}>
        {order.orderType ? (
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-1 text-[10px] tracking-[0.12em] uppercase",
              order.orderType === "subscription"
                ? "bg-steel-silver/10 text-steel-silver ring-1 ring-steel-silver/30"
                : "bg-graphite/40 text-text-secondary ring-1 ring-graphite"
            )}
          >
            {formatOrderTypeLabel(order.orderType)}
          </span>
        ) : (
          <span className="text-text-muted">—</span>
        )}
      </td>
      <td className={orderTableCellClass}>
        {order.roastifyStatus ? (
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-1 text-[10px] tracking-[0.12em] uppercase",
              "bg-steel-silver/15 text-text-primary ring-1 ring-steel-silver/40"
            )}
          >
            {order.roastifyStatus}
          </span>
        ) : (
          <span className="text-text-muted">—</span>
        )}
      </td>
      <td className={orderTableCellClass}>
        {order.trackingNumber ? (
          <div className="space-y-1">
            {order.trackingUrl ? (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="text-text-primary transition-colors hover:text-steel-silver"
              >
                {order.trackingNumber}
              </a>
            ) : (
              <p className="text-text-primary">{order.trackingNumber}</p>
            )}
            {order.carrier ? (
              <p className="text-xs text-text-muted">{order.carrier}</p>
            ) : null}
          </div>
        ) : (
          <span className="text-text-muted">—</span>
        )}
      </td>
      <td className={orderTableCellClass}>
        {order.roastifyOrderId ? (
          <p
            className="font-mono text-xs text-text-muted"
            title={order.roastifyOrderId}
          >
            {truncateRoastifyOrderId(order.roastifyOrderId)}
          </p>
        ) : (
          <span className="text-text-muted">—</span>
        )}
      </td>
    </tr>
  );
}

interface AdminOrderHistoryTableProps {
  orders: AdminOrderRow[];
  emptyMessage?: string;
  alwaysShowTable?: boolean;
}

export function AdminOrderHistoryTable({
  orders,
  emptyMessage = "No orders yet.",
  alwaysShowTable = false,
}: AdminOrderHistoryTableProps) {
  if (orders.length === 0 && !alwaysShowTable) {
    return (
      <div className="rounded-[8px] border border-graphite bg-soft-black/40 p-10 text-center">
        <p className="text-sm text-text-secondary">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 rounded-[8px] border border-graphite bg-soft-black/40">
      <table className={orderTableClass}>
        <OrderHistoryHeader />
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td
                colSpan={ORDER_HISTORY_COLUMN_COUNT}
                className={`${orderTableCellClass} py-10 text-center text-sm text-text-secondary`}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            orders.map((order) => <OrderHistoryRow key={order.id} order={order} />)
          )}
        </tbody>
      </table>
    </div>
  );
}
