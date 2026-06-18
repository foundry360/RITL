import { isStripeSecretConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { getRoastifyOrder, listRoastifyOrders } from "@/lib/roastify/client";
import { isRoastifyConfigured } from "@/lib/roastify/config";
import {
  buildRoastifyItemsSummary,
  getRoastifyOrderStatus,
  getRoastifyOrderTracking,
} from "@/lib/roastify/parse-order";
import type { RoastifyOrderDetail } from "@/lib/roastify/types";

export interface AdminWholesaleOrderRow {
  id: string;
  roastifyOrderId: string;
  customerName: string;
  customerEmail: string;
  company?: string;
  createdAt: string;
  itemsSummary: string;
  roastifyStatus?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  roastifyUpdatedAt?: string;
  externalSourceId?: string;
}

export interface AdminWholesaleLineItem {
  sku: string;
  quantity: number;
  artworkUrl?: string;
}

export interface AdminWholesaleOrderDetail extends AdminWholesaleOrderRow {
  shippingAddress?: string;
  lineItems: AdminWholesaleLineItem[];
}

export const ADMIN_WHOLESALE_PAGE_SIZES = [25, 50, 75, 100] as const;
export type AdminWholesalePageSize = (typeof ADMIN_WHOLESALE_PAGE_SIZES)[number];
export const DEFAULT_ADMIN_WHOLESALE_PAGE_SIZE: AdminWholesalePageSize = 25;

export const ADMIN_WHOLESALE_SORT_FIELDS = [
  "customerName",
  "company",
  "itemsSummary",
  "createdAt",
  "roastifyStatus",
  "trackingNumber",
  "roastifyOrderId",
] as const;
export type AdminWholesaleSortField = (typeof ADMIN_WHOLESALE_SORT_FIELDS)[number];
export type AdminWholesaleSortDirection = "asc" | "desc";
export const DEFAULT_ADMIN_WHOLESALE_SORT_FIELD: AdminWholesaleSortField = "createdAt";
export const DEFAULT_ADMIN_WHOLESALE_SORT_DIRECTION: AdminWholesaleSortDirection =
  "desc";

export interface AdminWholesaleListResult {
  orders: AdminWholesaleOrderRow[];
  total: number;
  page: number;
  pageSize: AdminWholesalePageSize;
  totalPages: number;
  sortBy: AdminWholesaleSortField;
  sortDir: AdminWholesaleSortDirection;
}

export interface ListAdminWholesaleOptions {
  query?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
}

function normalizePageSize(pageSize?: number): AdminWholesalePageSize {
  if (
    pageSize === 25 ||
    pageSize === 50 ||
    pageSize === 75 ||
    pageSize === 100
  ) {
    return pageSize;
  }

  return DEFAULT_ADMIN_WHOLESALE_PAGE_SIZE;
}

function normalizePage(page?: number): number {
  if (!page || !Number.isFinite(page) || page < 1) {
    return 1;
  }

  return Math.floor(page);
}

function normalizeSortField(sortBy?: string): AdminWholesaleSortField {
  if (
    sortBy &&
    ADMIN_WHOLESALE_SORT_FIELDS.includes(sortBy as AdminWholesaleSortField)
  ) {
    return sortBy as AdminWholesaleSortField;
  }

  return DEFAULT_ADMIN_WHOLESALE_SORT_FIELD;
}

function normalizeSortDirection(sortDir?: string): AdminWholesaleSortDirection {
  return sortDir === "asc" ? "asc" : "desc";
}

function compareStrings(
  left?: string,
  right?: string,
  emptyLast = false
): number {
  const leftValue = left?.trim() ?? "";
  const rightValue = right?.trim() ?? "";

  if (emptyLast) {
    if (!leftValue && !rightValue) {
      return 0;
    }

    if (!leftValue) {
      return 1;
    }

    if (!rightValue) {
      return -1;
    }
  }

  return leftValue.localeCompare(rightValue, undefined, {
    sensitivity: "base",
  });
}

function formatRoastifyAddress(order: RoastifyOrderDetail): string | undefined {
  const address = order.toAddress;
  if (!address?.street1) {
    return undefined;
  }

  const lines = [
    address.name,
    address.company,
    address.street1,
    address.street2,
    [address.city, address.state, address.zip].filter(Boolean).join(", "),
    address.country,
    address.phone,
    address.email,
  ].filter(Boolean);

  return lines.join("\n");
}

function buildWholesaleLineItems(
  order: RoastifyOrderDetail
): AdminWholesaleLineItem[] {
  return (order.items ?? []).map((item) => ({
    sku: item.sku?.trim() || "—",
    quantity:
      typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1,
    artworkUrl: item.artworkUrl?.trim() || undefined,
  }));
}

function toWholesaleOrderRow(order: RoastifyOrderDetail): AdminWholesaleOrderRow {
  const tracking = getRoastifyOrderTracking(order);
  const address = order.toAddress;
  const customerName =
    address?.name?.trim() ||
    address?.company?.trim() ||
    "Wholesale customer";
  const createdAt =
    order.createdAt?.trim() ||
    order.updatedAt?.trim() ||
    new Date(0).toISOString();

  return {
    id: order.orderId,
    roastifyOrderId: order.orderId,
    customerName,
    customerEmail: address?.email?.trim() || "—",
    company: address?.company?.trim() || undefined,
    createdAt,
    itemsSummary: buildRoastifyItemsSummary(order) ?? "—",
    roastifyStatus: getRoastifyOrderStatus(order),
    trackingNumber: tracking.trackingNumber,
    trackingUrl: tracking.trackingUrl,
    carrier: tracking.carrier,
    roastifyUpdatedAt: order.updatedAt,
    externalSourceId: order.externalSourceId?.trim() || undefined,
  };
}

function toWholesaleOrderDetail(
  order: RoastifyOrderDetail
): AdminWholesaleOrderDetail {
  return {
    ...toWholesaleOrderRow(order),
    shippingAddress: formatRoastifyAddress(order),
    lineItems: buildWholesaleLineItems(order),
  };
}

async function collectWebsiteRoastifyOrderIds(): Promise<Set<string>> {
  if (!isStripeSecretConfigured()) {
    return new Set();
  }

  const stripe = getStripe();
  const websiteOrderIds = new Set<string>();
  let startingAfter: string | undefined;

  while (true) {
    const page = await stripe.paymentIntents.list({
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    for (const paymentIntent of page.data) {
      const roastifyOrderId = paymentIntent.metadata?.ritl_roastify_order_id?.trim();
      if (roastifyOrderId) {
        websiteOrderIds.add(roastifyOrderId);
      }
    }

    if (!page.has_more || page.data.length === 0) {
      break;
    }

    startingAfter = page.data[page.data.length - 1]?.id;
  }

  return websiteOrderIds;
}

async function listAllWholesaleRoastifyOrders(): Promise<RoastifyOrderDetail[]> {
  const roastifyOrders = await listRoastifyOrders({
    pageSize: 100,
    maxPages: 50,
  });
  const websiteOrderIds = await collectWebsiteRoastifyOrderIds();

  return roastifyOrders.filter((order) => !websiteOrderIds.has(order.orderId));
}

function filterWholesaleOrders(
  orders: AdminWholesaleOrderRow[],
  query?: string
): AdminWholesaleOrderRow[] {
  const normalizedQuery = query?.trim().toLowerCase();
  if (!normalizedQuery) {
    return orders;
  }

  return orders.filter((order) => {
    const haystack = [
      order.customerName,
      order.customerEmail,
      order.company,
      order.itemsSummary,
      order.roastifyStatus,
      order.trackingNumber,
      order.carrier,
      order.roastifyOrderId,
      order.externalSourceId,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

function sortWholesaleOrders(
  orders: AdminWholesaleOrderRow[],
  sortBy: AdminWholesaleSortField,
  sortDir: AdminWholesaleSortDirection
): AdminWholesaleOrderRow[] {
  const direction = sortDir === "asc" ? 1 : -1;

  return [...orders].sort((left, right) => {
    let comparison = 0;

    switch (sortBy) {
      case "customerName":
        comparison = compareStrings(left.customerName, right.customerName);
        break;
      case "company":
        comparison = compareStrings(left.company, right.company, true);
        break;
      case "itemsSummary":
        comparison = compareStrings(left.itemsSummary, right.itemsSummary);
        break;
      case "createdAt":
        comparison = compareStrings(left.createdAt, right.createdAt);
        break;
      case "roastifyStatus":
        comparison = compareStrings(
          left.roastifyStatus,
          right.roastifyStatus,
          true
        );
        break;
      case "trackingNumber":
        comparison = compareStrings(
          left.trackingNumber,
          right.trackingNumber,
          true
        );
        break;
      case "roastifyOrderId":
        comparison = compareStrings(
          left.roastifyOrderId,
          right.roastifyOrderId,
          true
        );
        break;
    }

    if (comparison === 0) {
      comparison = compareStrings(right.createdAt, left.createdAt);
    }

    return comparison * direction;
  });
}

export async function listAdminWholesaleOrders(
  options: ListAdminWholesaleOptions = {}
): Promise<AdminWholesaleListResult> {
  const page = normalizePage(options.page);
  const pageSize = normalizePageSize(options.pageSize);
  const sortBy = normalizeSortField(options.sortBy);
  const sortDir = normalizeSortDirection(options.sortDir);

  if (!isRoastifyConfigured()) {
    return {
      orders: [],
      total: 0,
      page: 1,
      pageSize,
      totalPages: 0,
      sortBy,
      sortDir,
    };
  }

  const roastifyOrders = await listAllWholesaleRoastifyOrders();
  const allOrders = roastifyOrders.map(toWholesaleOrderRow);
  const filteredOrders = filterWholesaleOrders(allOrders, options.query);
  const sortedOrders = sortWholesaleOrders(filteredOrders, sortBy, sortDir);
  const total = sortedOrders.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const orders = sortedOrders.slice(startIndex, startIndex + pageSize);

  return {
    orders,
    total,
    page: currentPage,
    pageSize,
    totalPages,
    sortBy,
    sortDir,
  };
}

export async function getAdminWholesaleOrder(
  orderId: string
): Promise<AdminWholesaleOrderDetail | null> {
  if (!isRoastifyConfigured()) {
    return null;
  }

  const websiteOrderIds = await collectWebsiteRoastifyOrderIds();
  if (websiteOrderIds.has(orderId)) {
    return null;
  }

  try {
    const order = await getRoastifyOrder(orderId);
    return toWholesaleOrderDetail(order);
  } catch {
    return null;
  }
}
