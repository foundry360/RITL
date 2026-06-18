"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ADMIN_WHOLESALE_PAGE_SIZES,
  type AdminWholesaleListResult,
  type AdminWholesalePageSize,
  type AdminWholesaleSortDirection,
  type AdminWholesaleSortField,
} from "@/lib/admin/wholesale";
import { truncateRoastifyOrderId } from "@/lib/admin/format";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  orderTableCellClass,
  orderTableClass,
  orderTableHeaderClass,
  wholesalePanelColumnWidths,
} from "@/components/admin/orderTable";

interface WholesalePanelProps {
  initialResult: AdminWholesaleListResult;
}

const SORTABLE_COLUMNS: Array<{ field: AdminWholesaleSortField; label: string }> =
  [
    { field: "customerName", label: "Customer" },
    { field: "company", label: "Company" },
    { field: "itemsSummary", label: "Items" },
    { field: "createdAt", label: "Date" },
    { field: "roastifyStatus", label: "Progress" },
    { field: "trackingNumber", label: "Tracking" },
    { field: "roastifyOrderId", label: "Order ID" },
  ];

const columnWidthByField: Record<AdminWholesaleSortField, string> = {
  customerName: wholesalePanelColumnWidths.customer,
  company: wholesalePanelColumnWidths.company,
  itemsSummary: wholesalePanelColumnWidths.items,
  createdAt: wholesalePanelColumnWidths.date,
  roastifyStatus: wholesalePanelColumnWidths.progress,
  trackingNumber: wholesalePanelColumnWidths.tracking,
  roastifyOrderId: wholesalePanelColumnWidths.orderId,
};

const TABLE_COLUMN_COUNT = 7;

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
  field: AdminWholesaleSortField
): AdminWholesaleSortDirection {
  return field === "createdAt" ? "desc" : "asc";
}

function buildWholesaleUrl(options: {
  query: string;
  page: number;
  pageSize: AdminWholesalePageSize;
  sortBy: AdminWholesaleSortField;
  sortDir: AdminWholesaleSortDirection;
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

  return `/api/admin/wholesale?${params.toString()}`;
}

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction: AdminWholesaleSortDirection;
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

export function WholesalePanel({ initialResult }: WholesalePanelProps) {
  const [result, setResult] = useState(initialResult);
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState<AdminWholesalePageSize>(
    initialResult.pageSize
  );
  const [sortBy, setSortBy] = useState<AdminWholesaleSortField>(
    initialResult.sortBy
  );
  const [sortDir, setSortDir] = useState<AdminWholesaleSortDirection>(
    initialResult.sortDir
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipInitialFilterFetch = useRef(true);

  const fetchOrders = useCallback(
    async (options: {
      nextQuery: string;
      page: number;
      nextPageSize: AdminWholesalePageSize;
      nextSortBy: AdminWholesaleSortField;
      nextSortDir: AdminWholesaleSortDirection;
    }) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          buildWholesaleUrl({
            query: options.nextQuery,
            page: options.page,
            pageSize: options.nextPageSize,
            sortBy: options.nextSortBy,
            sortDir: options.nextSortDir,
          })
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load wholesale orders");
        }

        setResult(data);
        setSortBy(data.sortBy);
        setSortDir(data.sortDir);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load wholesale orders";
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
      nextPageSize: AdminWholesalePageSize = pageSize,
      nextSortBy: AdminWholesaleSortField = sortBy,
      nextSortDir: AdminWholesaleSortDirection = sortDir
    ) => {
      void fetchOrders({
        nextQuery,
        page,
        nextPageSize,
        nextSortBy,
        nextSortDir,
      });
    },
    [fetchOrders, pageSize, sortBy, sortDir]
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
  }, [query, pageSize, loadOrders]);

  const { orders, total, page, totalPages } = result;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * pageSize, total);
  const hasActiveFilter = query.trim().length > 0;

  function handlePageSizeChange(nextPageSize: AdminWholesalePageSize) {
    setPageSize(nextPageSize);
  }

  function handleSort(column: AdminWholesaleSortField) {
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
            Wholesale
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Roastify wholesale orders that are not linked to website checkout.
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
              placeholder="Search customer, company, items, status, tracking, or order ID"
              aria-label="Filter wholesale orders"
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

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {total === 0 && !hasActiveFilter ? (
        <div className="rounded-[8px] border border-graphite bg-soft-black/40 p-10 text-center">
          <p className="text-sm text-text-secondary">
            No wholesale orders found in Roastify yet.
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
                    const widthClass = columnWidthByField[column.field];

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
                      colSpan={TABLE_COLUMN_COUNT}
                      className={`${orderTableCellClass} py-10 text-center text-sm text-text-secondary`}
                    >
                      No wholesale orders match your filter.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-graphite/60 last:border-b-0 transition-colors hover:bg-graphite/20"
                    >
                      <td className={orderTableCellClass}>
                        <Link
                          href={`/admin/wholesale/${order.id}`}
                          className="text-text-primary transition-colors hover:text-steel-silver"
                        >
                          {order.customerName}
                        </Link>
                        <p className="mt-1 text-xs text-text-muted">
                          {order.customerEmail}
                        </p>
                      </td>
                      <td className={orderTableCellClass}>
                        {order.company ?? "—"}
                      </td>
                      <td className={orderTableCellClass}>
                        <Link
                          href={`/admin/wholesale/${order.id}`}
                          className="text-text-primary transition-colors hover:text-steel-silver"
                        >
                          {order.itemsSummary}
                        </Link>
                      </td>
                      <td className={`${orderTableCellClass} whitespace-nowrap`}>
                        {formatOrderDate(order.createdAt)}
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
                        <Link
                          href={`/admin/wholesale/${order.id}`}
                          className="font-mono text-xs text-text-muted transition-colors hover:text-text-primary"
                          title={order.roastifyOrderId}
                        >
                          {truncateRoastifyOrderId(order.roastifyOrderId)}
                        </Link>
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
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <span>Per page</span>
                <select
                  value={pageSize}
                  onChange={(event) =>
                    handlePageSizeChange(
                      Number(event.target.value) as AdminWholesalePageSize
                    )
                  }
                  className="rounded-[8px] border border-graphite bg-soft-black/60 px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-steel-silver/40"
                >
                  {ADMIN_WHOLESALE_PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={page <= 1 || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={page >= totalPages || isLoading || totalPages === 0}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
