"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ADMIN_ORDER_PAGE_SIZES,
  type AdminOrderPageSize,
  type AdminOrdersListResult,
  type AdminOrderSortDirection,
  type AdminOrderSortField,
} from "@/lib/admin/orders";
import {
  ADMIN_ORDER_ITEM_FILTERS,
  ADMIN_ORDER_PROGRESS_FILTERS,
  ADMIN_ORDER_TYPE_FILTERS,
  adminOrdersFilterInputClass,
  adminOrdersFilterSelectClass,
  hasActiveAdminOrderFilters,
} from "@/lib/admin/order-filters";
import { truncateRoastifyOrderId, formatOrderTypeLabel } from "@/lib/admin/format";
import { formatPrice } from "@/lib/checkout/format";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { FulfillmentProgressSteps } from "@/components/admin/FulfillmentProgressSteps";
import {
  orderTableCellClass,
  orderTableClass,
  orderTableHeaderClass,
  ordersPanelColumnWidths,
} from "@/components/admin/orderTable";

interface OrdersPanelProps {
  initialResult: AdminOrdersListResult;
}

const SORTABLE_COLUMNS: Array<{ field: AdminOrderSortField; label: string }> = [
  { field: "customerName", label: "Customer" },
  { field: "itemsSummary", label: "Items" },
  { field: "createdAt", label: "Date" },
  { field: "amount", label: "Total" },
  { field: "orderType", label: "Type" },
  { field: "roastifyStatus", label: "Progress" },
  { field: "trackingNumber", label: "Tracking" },
  { field: "roastifyOrderId", label: "Order ID" },
];

const orderColumnWidthByField: Record<AdminOrderSortField, string> = {
  customerName: ordersPanelColumnWidths.customer,
  itemsSummary: ordersPanelColumnWidths.items,
  createdAt: ordersPanelColumnWidths.date,
  amount: ordersPanelColumnWidths.total,
  orderType: ordersPanelColumnWidths.type,
  roastifyStatus: ordersPanelColumnWidths.progress,
  trackingNumber: ordersPanelColumnWidths.tracking,
  roastifyOrderId: ordersPanelColumnWidths.orderId,
};

const ORDER_TABLE_COLUMN_COUNT = 8;

function formatOrderDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

function defaultSortDirection(
  field: AdminOrderSortField
): AdminOrderSortDirection {
  return field === "createdAt" || field === "amount" ? "desc" : "asc";
}

function buildOrdersUrl(options: {
  query: string;
  page: number;
  pageSize: AdminOrderPageSize;
  sortBy: AdminOrderSortField;
  sortDir: AdminOrderSortDirection;
  progress: string;
  productId: string;
  orderType: string;
  dateFrom: string;
  dateTo: string;
}): string {
  const params = new URLSearchParams({
    page: String(options.page),
    pageSize: String(options.pageSize),
    sortBy: options.sortBy,
    sortDir: options.sortDir,
  });

  const trimmedQuery = options.query.trim();
  if (trimmedQuery) {
    params.set("q", trimmedQuery);
  }

  if (options.progress) {
    params.set("progress", options.progress);
  }

  if (options.productId) {
    params.set("productId", options.productId);
  }

  if (options.orderType) {
    params.set("orderType", options.orderType);
  }

  if (options.dateFrom) {
    params.set("dateFrom", options.dateFrom);
  }

  if (options.dateTo) {
    params.set("dateTo", options.dateTo);
  }

  return `/api/admin/orders?${params.toString()}`;
}

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction: AdminOrderSortDirection;
}) {
  if (!active) {
    return (
      <span className="text-text-muted/50" aria-hidden="true">
        ↕
      </span>
    );
  }

  return (
    <span className="text-text-primary" aria-hidden="true">
      {direction === "asc" ? "↑" : "↓"}
    </span>
  );
}

function FilterIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="text-text-muted"
    >
      <path
        d="M3 5h14M6 10h8M9 15h2"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function OrdersPanel({ initialResult }: OrdersPanelProps) {
  const [result, setResult] = useState(initialResult);
  const [query, setQuery] = useState("");
  const [progress, setProgress] = useState("");
  const [productId, setProductId] = useState("");
  const [orderType, setOrderType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pageSize, setPageSize] = useState<AdminOrderPageSize>(
    initialResult.pageSize
  );
  const [sortBy, setSortBy] = useState<AdminOrderSortField>(initialResult.sortBy);
  const [sortDir, setSortDir] = useState<AdminOrderSortDirection>(
    initialResult.sortDir
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipInitialFilterFetch = useRef(true);

  const fetchOrders = useCallback(
    async (options: {
      nextQuery: string;
      page: number;
      nextPageSize: AdminOrderPageSize;
      nextSortBy: AdminOrderSortField;
      nextSortDir: AdminOrderSortDirection;
      nextProgress: string;
      nextProductId: string;
      nextOrderType: string;
      nextDateFrom: string;
      nextDateTo: string;
    }) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          buildOrdersUrl({
            query: options.nextQuery,
            page: options.page,
            pageSize: options.nextPageSize,
            sortBy: options.nextSortBy,
            sortDir: options.nextSortDir,
            progress: options.nextProgress,
            productId: options.nextProductId,
            orderType: options.nextOrderType,
            dateFrom: options.nextDateFrom,
            dateTo: options.nextDateTo,
          })
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load orders");
        }

        setResult(data);
        setSortBy(data.sortBy);
        setSortDir(data.sortDir);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load orders";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const loadOrders = useCallback(
    (
      nextQuery: string,
      page: number,
      nextPageSize: AdminOrderPageSize = pageSize,
      nextSortBy: AdminOrderSortField = sortBy,
      nextSortDir: AdminOrderSortDirection = sortDir,
      nextProgress: string = progress,
      nextProductId: string = productId,
      nextOrderType: string = orderType,
      nextDateFrom: string = dateFrom,
      nextDateTo: string = dateTo
    ) => {
      void fetchOrders({
        nextQuery,
        page,
        nextPageSize,
        nextSortBy,
        nextSortDir,
        nextProgress,
        nextProductId,
        nextOrderType,
        nextDateFrom,
        nextDateTo,
      });
    },
    [fetchOrders, pageSize, sortBy, sortDir, progress, productId, orderType, dateFrom, dateTo]
  );

  useEffect(() => {
    if (skipInitialFilterFetch.current) {
      skipInitialFilterFetch.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      loadOrders(query, 1);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [query, pageSize, progress, productId, orderType, dateFrom, dateTo, loadOrders]);

  const { orders, total, page, totalPages } = result;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * pageSize, total);
  const hasActiveFilter = hasActiveAdminOrderFilters(
    { progress, productId, orderType, dateFrom, dateTo },
    query
  );

  function handleClearFilters() {
    setQuery("");
    setProgress("");
    setProductId("");
    setOrderType("");
    setDateFrom("");
    setDateTo("");
  }

  function handlePageSizeChange(nextPageSize: AdminOrderPageSize) {
    setPageSize(nextPageSize);
  }

  function handleSort(column: AdminOrderSortField) {
    const nextSortDir =
      sortBy === column
        ? sortDir === "asc"
          ? "desc"
          : "asc"
        : defaultSortDirection(column);

    setSortBy(column);
    setSortDir(nextSortDir);
    loadOrders(query, 1, pageSize, column, nextSortDir);
  }

  function handlePreviousPage() {
    if (page <= 1 || isLoading) {
      return;
    }

    loadOrders(query, page - 1);
  }

  function handleNextPage() {
    if (page >= totalPages || isLoading) {
      return;
    }

    loadOrders(query, page + 1);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-text-primary">
            Orders
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Recent orders from Stripe with live fulfillment and tracking from
            Roastify.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
          <label className="relative block w-full sm:min-w-[20rem] lg:min-w-[24rem]">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              <FilterIcon />
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search customer, items, status, tracking, or order ID"
              aria-label="Filter orders"
              className="h-11 w-full rounded-[8px] border border-graphite bg-soft-black/60 pl-10 pr-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-steel-silver/40"
            />
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadOrders(query, page)}
            disabled={isLoading}
            className="h-11 shrink-0 px-5"
          >
            {isLoading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <label className="space-y-2">
            <span className="text-[10px] tracking-[0.14em] uppercase text-text-muted">
              Progress
            </span>
            <select
              value={progress}
              onChange={(event) => setProgress(event.target.value)}
              aria-label="Filter by progress"
              className={cn(adminOrdersFilterSelectClass, "w-full")}
            >
              {ADMIN_ORDER_PROGRESS_FILTERS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[10px] tracking-[0.14em] uppercase text-text-muted">
              Items
            </span>
            <select
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              aria-label="Filter by items"
              className={cn(adminOrdersFilterSelectClass, "w-full")}
            >
              {ADMIN_ORDER_ITEM_FILTERS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[10px] tracking-[0.14em] uppercase text-text-muted">
              Type
            </span>
            <select
              value={orderType}
              onChange={(event) => setOrderType(event.target.value)}
              aria-label="Filter by type"
              className={cn(adminOrdersFilterSelectClass, "w-full")}
            >
              {ADMIN_ORDER_TYPE_FILTERS.map((option) => (
                <option key={option.value || "all-types"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[10px] tracking-[0.14em] uppercase text-text-muted">
              From
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              aria-label="Filter from date"
              className={cn(adminOrdersFilterInputClass, "w-full")}
            />
          </label>

          <label className="space-y-2">
            <span className="text-[10px] tracking-[0.14em] uppercase text-text-muted">
              To
            </span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              aria-label="Filter to date"
              className={cn(adminOrdersFilterInputClass, "w-full")}
            />
          </label>
        </div>

        {hasActiveFilter ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            disabled={isLoading}
            className="h-11 shrink-0 px-5"
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {total === 0 && !hasActiveFilter ? (
        <div className="rounded-[8px] border border-graphite bg-soft-black/40 p-10 text-center">
          <p className="text-sm text-text-secondary">
            No completed orders yet. Orders appear here after checkout succeeds.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-[8px] border border-graphite bg-soft-black/40">
            <table className={orderTableClass}>
              <thead>
                <tr className="border-b border-graphite">
                  {SORTABLE_COLUMNS.map((column) => {
                    const isActive = sortBy === column.field;
                    const widthClass = orderColumnWidthByField[column.field];

                    return (
                      <th
                        key={column.field}
                        className={cn(orderTableHeaderClass, widthClass)}
                      >
                        <button
                          type="button"
                          onClick={() => handleSort(column.field)}
                          className={cn(
                            "inline-flex items-center gap-2 transition-colors hover:text-text-primary",
                            isActive && "text-text-primary"
                          )}
                          aria-sort={
                            isActive
                              ? sortDir === "asc"
                                ? "ascending"
                                : "descending"
                              : "none"
                          }
                        >
                          <span>{column.label}</span>
                          <SortIndicator active={isActive} direction={sortDir} />
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={ORDER_TABLE_COLUMN_COUNT}
                      className={`${orderTableCellClass} py-10 text-center text-sm text-text-secondary`}
                    >
                      No orders match your filter.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-graphite/60 last:border-b-0 transition-colors hover:bg-graphite/20"
                    >
                      <td className={orderTableCellClass}>
                        {order.stripeCustomerId ? (
                          <Link
                            href={`/admin/customers/${order.stripeCustomerId}`}
                            className="text-text-primary transition-colors hover:text-steel-silver"
                          >
                            {order.customerName}
                          </Link>
                        ) : (
                          <p className="text-text-primary">{order.customerName}</p>
                        )}
                      </td>
                      <td className={orderTableCellClass}>
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
                      <td
                        className={`${orderTableCellClass} whitespace-nowrap text-text-primary`}
                      >
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
                        <FulfillmentProgressSteps status={order.roastifyStatus} />
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
                              <p className="text-text-primary">
                                {order.trackingNumber}
                              </p>
                            )}
                            {order.carrier ? (
                              <p className="text-xs text-text-muted">
                                {order.carrier}
                              </p>
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              {total === 0
                ? "Showing 0 orders"
                : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs tracking-[0.12em] uppercase text-text-muted">
                <span>Per page</span>
                <select
                  value={pageSize}
                  onChange={(event) =>
                    handlePageSizeChange(
                      Number(event.target.value) as AdminOrderPageSize
                    )
                  }
                  className="rounded-[8px] border border-graphite bg-soft-black/60 px-3 py-2 text-sm normal-case tracking-normal text-text-primary outline-none transition-colors focus:border-steel-silver/40"
                >
                  {ADMIN_ORDER_PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={isLoading || page <= 1}
              >
                Previous
              </Button>
              <span className="text-xs tracking-[0.12em] uppercase text-text-muted">
                Page {totalPages === 0 ? 0 : page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={isLoading || page >= totalPages || totalPages === 0}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
