"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ADMIN_CUSTOMER_PAGE_SIZES,
  type AdminCustomerPageSize,
  type AdminCustomerSortDirection,
  type AdminCustomerSortField,
  type AdminCustomersListResult,
} from "@/lib/admin/customers";
import { formatPrice } from "@/lib/checkout/format";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface CustomersPanelProps {
  initialResult: AdminCustomersListResult;
}

const SORTABLE_COLUMNS: Array<{ field: AdminCustomerSortField; label: string }> =
  [
    { field: "name", label: "Name" },
    { field: "email", label: "Email" },
    { field: "phone", label: "Phone" },
    { field: "location", label: "Location" },
    { field: "orderCount", label: "Orders" },
    { field: "totalSpent", label: "Total Spent" },
    { field: "lastOrderAt", label: "Last Order" },
  ];

function formatCustomerDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(isoDate));
}

const tableHeaderClass =
  "px-4 py-3 text-xs tracking-[0.14em] uppercase text-text-muted font-medium";
const tableCellClass = "px-4 py-4 align-top text-sm text-text-secondary";

function defaultSortDirection(
  field: AdminCustomerSortField
): AdminCustomerSortDirection {
  return field === "orderCount" ||
    field === "totalSpent" ||
    field === "lastOrderAt"
    ? "desc"
    : "asc";
}

function buildCustomersUrl(options: {
  query: string;
  page: number;
  pageSize: AdminCustomerPageSize;
  sortBy: AdminCustomerSortField;
  sortDir: AdminCustomerSortDirection;
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

  return `/api/admin/customers?${params.toString()}`;
}

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction: AdminCustomerSortDirection;
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

export function CustomersPanel({ initialResult }: CustomersPanelProps) {
  const [result, setResult] = useState(initialResult);
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState<AdminCustomerPageSize>(
    initialResult.pageSize
  );
  const [sortBy, setSortBy] = useState<AdminCustomerSortField>(
    initialResult.sortBy
  );
  const [sortDir, setSortDir] = useState<AdminCustomerSortDirection>(
    initialResult.sortDir
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipInitialFilterFetch = useRef(true);

  const fetchCustomers = useCallback(
    async (options: {
      nextQuery: string;
      page: number;
      nextPageSize: AdminCustomerPageSize;
      nextSortBy: AdminCustomerSortField;
      nextSortDir: AdminCustomerSortDirection;
    }) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          buildCustomersUrl({
            query: options.nextQuery,
            page: options.page,
            pageSize: options.nextPageSize,
            sortBy: options.nextSortBy,
            sortDir: options.nextSortDir,
          })
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load customers");
        }

        setResult(data);
        setSortBy(data.sortBy);
        setSortDir(data.sortDir);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load customers";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const loadCustomers = useCallback(
    (
      nextQuery: string,
      page: number,
      nextPageSize: AdminCustomerPageSize = pageSize,
      nextSortBy: AdminCustomerSortField = sortBy,
      nextSortDir: AdminCustomerSortDirection = sortDir
    ) => {
      void fetchCustomers({
        nextQuery,
        page,
        nextPageSize,
        nextSortBy,
        nextSortDir,
      });
    },
    [fetchCustomers, pageSize, sortBy, sortDir]
  );

  useEffect(() => {
    if (skipInitialFilterFetch.current) {
      skipInitialFilterFetch.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      loadCustomers(query, 1);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [query, pageSize, loadCustomers]);

  const { customers, total, page, totalPages } = result;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * pageSize, total);
  const hasActiveFilter = query.trim().length > 0;

  function handlePageSizeChange(nextPageSize: AdminCustomerPageSize) {
    setPageSize(nextPageSize);
  }

  function handleSort(column: AdminCustomerSortField) {
    const nextSortDir =
      sortBy === column
        ? sortDir === "asc"
          ? "desc"
          : "asc"
        : defaultSortDirection(column);

    setSortBy(column);
    setSortDir(nextSortDir);
    loadCustomers(query, 1, pageSize, column, nextSortDir);
  }

  function handlePreviousPage() {
    if (page <= 1 || isLoading) {
      return;
    }

    loadCustomers(query, page - 1);
  }

  function handleNextPage() {
    if (page >= totalPages || isLoading) {
      return;
    }

    loadCustomers(query, page + 1);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-text-primary">
            Customers
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Stripe customer records with order activity and contact details.
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
              placeholder="Search name, email, phone, location, or Stripe ID"
              aria-label="Filter customers"
              className="h-11 w-full rounded-[8px] border border-graphite bg-soft-black/60 pl-10 pr-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-steel-silver/40"
            />
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadCustomers(query, page)}
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
            No customers yet. Records appear here after checkout.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-[8px] border border-graphite bg-soft-black/40">
            <table className="w-full min-w-[960px] text-left">
              <thead>
                <tr className="border-b border-graphite">
                  {SORTABLE_COLUMNS.map((column) => {
                    const isActive = sortBy === column.field;

                    return (
                      <th key={column.field} className={tableHeaderClass}>
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
                {customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className={`${tableCellClass} py-10 text-center text-sm text-text-secondary`}
                    >
                      No customers match your filter.
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-graphite/60 last:border-b-0 transition-colors hover:bg-graphite/20"
                    >
                      <td className={tableCellClass}>
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="text-text-primary transition-colors hover:text-steel-silver"
                        >
                          {customer.name}
                        </Link>
                      </td>
                      <td className={tableCellClass}>{customer.email}</td>
                      <td className={tableCellClass}>{customer.phone ?? "—"}</td>
                      <td className={tableCellClass}>{customer.location ?? "—"}</td>
                      <td className={tableCellClass}>{customer.orderCount}</td>
                      <td className={`${tableCellClass} text-text-primary`}>
                        {formatPrice(customer.totalSpent / 100)}
                      </td>
                      <td className={`${tableCellClass} whitespace-nowrap`}>
                        {customer.lastOrderAt
                          ? formatCustomerDate(customer.lastOrderAt)
                          : "—"}
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
                ? "Showing 0 customers"
                : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs tracking-[0.12em] uppercase text-text-muted">
                <span>Per page</span>
                <select
                  value={pageSize}
                  onChange={(event) =>
                    handlePageSizeChange(
                      Number(event.target.value) as AdminCustomerPageSize
                    )
                  }
                  className="rounded-[8px] border border-graphite bg-soft-black/60 px-3 py-2 text-sm normal-case tracking-normal text-text-primary outline-none transition-colors focus:border-steel-silver/40"
                >
                  {ADMIN_CUSTOMER_PAGE_SIZES.map((size) => (
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
