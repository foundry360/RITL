import type { AdminOrderType } from "@/lib/admin/format";
import { formatOrderTypeLabel } from "@/lib/admin/format";
import type { ProductId } from "@/lib/stripe/products";
import { products } from "@/lib/stripe/products";
import {
  formatRoastifyStatusLabel,
  FULFILLMENT_PROGRESS_STEPS,
} from "@/lib/roastify/fulfillment-progress";

export interface AdminOrderListFilters {
  progress?: string;
  productId?: string;
  orderType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const ADMIN_ORDER_TYPE_FILTERS = [
  { value: "", label: "All types" },
  { value: "one-time", label: formatOrderTypeLabel("one-time") },
  { value: "subscription", label: formatOrderTypeLabel("subscription") },
  { value: "mixed", label: formatOrderTypeLabel("mixed") },
  { value: "unknown", label: "Unspecified" },
] as const;

export type AdminOrderTypeFilter = (typeof ADMIN_ORDER_TYPE_FILTERS)[number]["value"];

export function isAdminOrderTypeFilter(
  value: string
): value is AdminOrderType | "unknown" {
  return (
    value === "one-time" ||
    value === "subscription" ||
    value === "mixed" ||
    value === "unknown"
  );
}

export const ADMIN_ORDER_PROGRESS_FILTERS = [
  { value: "", label: "All progress" },
  { value: "awaiting", label: "Awaiting" },
  ...FULFILLMENT_PROGRESS_STEPS.map((step) => ({
    value: step,
    label: formatRoastifyStatusLabel(step),
  })),
  { value: "canceled", label: "Canceled" },
] as const;

export const ADMIN_ORDER_ITEM_FILTERS = [
  { value: "", label: "All items" },
  ...(Object.keys(products) as ProductId[]).map((productId) => ({
    value: productId,
    label: products[productId].name,
  })),
] as const;

const DATE_FILTER_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeAdminOrderDateFilter(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || !DATE_FILTER_PATTERN.test(trimmed)) {
    return undefined;
  }

  return trimmed;
}

export function toOrderFilterDateStart(date: string): string {
  return `${date}T00:00:00.000Z`;
}

export function toOrderFilterDateEnd(date: string): string {
  return `${date}T23:59:59.999Z`;
}

export function hasActiveAdminOrderFilters(
  filters: AdminOrderListFilters,
  query?: string
): boolean {
  return Boolean(
    query?.trim() ||
      filters.progress ||
      filters.productId ||
      filters.orderType ||
      filters.dateFrom ||
      filters.dateTo
  );
}

export const adminOrdersFilterSelectClass =
  "h-11 rounded-[8px] border border-graphite bg-soft-black/60 px-3 text-sm text-text-primary outline-none transition-colors focus:border-steel-silver/40";

export const adminOrdersFilterInputClass =
  "h-11 rounded-[8px] border border-graphite bg-soft-black/60 px-3 text-sm text-text-primary outline-none transition-colors focus:border-steel-silver/40";
