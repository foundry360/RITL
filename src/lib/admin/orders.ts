import type Stripe from "stripe";
import { parseFulfillmentLineItems } from "@/lib/fulfillment/parse-items";
import { getRoastifyOrder, listRoastifyOrders } from "@/lib/roastify/client";
import { isRoastifyConfigured } from "@/lib/roastify/config";
import {
  buildRoastifyItemsSummary,
  getRoastifyOrderStatus,
  getRoastifyOrderTracking,
} from "@/lib/roastify/parse-order";
import type { RoastifyOrderDetail } from "@/lib/roastify/types";
import { syncRoastifyMetadataToStripe } from "@/lib/roastify/sync-stripe-metadata";
import type { AdminOrderType } from "@/lib/admin/format";
import {
  isAdminOrderTypeFilter,
  normalizeAdminOrderDateFilter,
  toOrderFilterDateEnd,
  toOrderFilterDateStart,
  type AdminOrderListFilters,
} from "@/lib/admin/order-filters";
import { listOrders, getOrderById, getOrderByStripePaymentIntentId, syncOrdersFromRoastify, syncOrderFulfillmentFromRoastify } from "@/lib/orders/repository";
import { orderRecordToAdminDetail, orderRecordToAdminRow } from "@/lib/orders/to-admin";
import { isOrdersDatabaseConfigured } from "@/lib/supabase/config";
import type { PurchaseType } from "@/lib/stripe/products";
import { getProduct } from "@/lib/stripe/products";
import { isStripeSecretConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";

export interface AdminOrderRow {
  id: string;
  stripeCustomerId?: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  createdAt: string;
  itemsSummary: string;
  orderType?: AdminOrderType;
  roastifyOrderId?: string;
  roastifyStatus?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  roastifyUpdatedAt?: string;
}

export interface AdminOrderLineItem {
  name: string;
  quantity: number;
  purchaseType: PurchaseType;
  unitLabel: string;
}

export interface AdminOrderDetail extends AdminOrderRow {
  shippingAddress?: string;
  lineItems: AdminOrderLineItem[];
}

function formatShippingAddress(
  paymentIntent: Stripe.PaymentIntent,
  roastifyOrder?: RoastifyOrderDetail
): string | undefined {
  const roastifyAddress = roastifyOrder?.toAddress;
  if (roastifyAddress?.street1) {
    const lines = [
      roastifyAddress.name,
      roastifyAddress.street1,
      roastifyAddress.street2,
      [roastifyAddress.city, roastifyAddress.state, roastifyAddress.zip]
        .filter(Boolean)
        .join(", "),
      roastifyAddress.country,
    ].filter(Boolean);

    return lines.join("\n");
  }

  const shipping = paymentIntent.shipping;
  if (!shipping?.address?.line1) {
    return undefined;
  }

  const lines = [
    shipping.name,
    shipping.address.line1,
    shipping.address.line2,
    [shipping.address.city, shipping.address.state, shipping.address.postal_code]
      .filter(Boolean)
      .join(", "),
    shipping.address.country,
  ].filter(Boolean);

  return lines.join("\n");
}

function buildOrderLineItems(
  paymentIntent: Stripe.PaymentIntent
): AdminOrderLineItem[] {
  return parseFulfillmentLineItems(paymentIntent.metadata?.ritl_items).map(
    (item) => {
      const product = getProduct(item.productId);
      return {
        name: product?.name ?? item.productId,
        quantity: item.quantity,
        purchaseType: item.purchaseType,
        unitLabel: "—",
      };
    }
  );
}

function toAdminOrderDetail(
  paymentIntent: Stripe.PaymentIntent,
  roastifyOrder?: RoastifyOrderDetail
): AdminOrderDetail {
  return {
    ...toAdminOrderRow(paymentIntent, roastifyOrder),
    shippingAddress: formatShippingAddress(paymentIntent, roastifyOrder),
    lineItems: buildOrderLineItems(paymentIntent),
  };
}

function buildItemsSummary(metadataItems: string | null | undefined): string {
  const items = parseFulfillmentLineItems(metadataItems);
  if (items.length === 0) {
    return "—";
  }

  return items
    .map((item) => {
      const product = getProduct(item.productId);
      const name = product?.name ?? item.productId;
      return `${name} × ${item.quantity}`;
    })
    .join(", ");
}

function resolveOrderType(
  metadataItems: string | null | undefined
): AdminOrderType | undefined {
  const items = parseFulfillmentLineItems(metadataItems);
  if (items.length === 0) {
    return undefined;
  }

  const hasSubscription = items.some(
    (item) => item.purchaseType === "subscription"
  );
  const hasOneTime = items.some((item) => item.purchaseType === "one-time");

  if (hasSubscription && hasOneTime) {
    return "mixed";
  }

  if (hasSubscription) {
    return "subscription";
  }

  return "one-time";
}

function resolveCustomerDetails(
  paymentIntent: Stripe.PaymentIntent,
  roastifyOrder?: RoastifyOrderDetail
): { name: string; email: string } {
  const roastifyName = roastifyOrder?.toAddress?.name?.trim();
  const roastifyEmail = roastifyOrder?.toAddress?.email?.trim();

  const customer =
    paymentIntent.customer && typeof paymentIntent.customer !== "string"
      ? paymentIntent.customer
      : null;
  const activeCustomer =
    customer && !("deleted" in customer && customer.deleted) ? customer : null;

  const email =
    roastifyEmail ??
    paymentIntent.receipt_email ??
    activeCustomer?.email ??
    "—";

  const name =
    roastifyName ??
    paymentIntent.shipping?.name ??
    activeCustomer?.name ??
    activeCustomer?.email ??
    "Customer";

  return {
    name: typeof name === "string" ? name : "Customer",
    email: typeof email === "string" ? email : "—",
  };
}

function toAdminOrderRow(
  paymentIntent: Stripe.PaymentIntent,
  roastifyOrder?: RoastifyOrderDetail
): AdminOrderRow {
  const customer = resolveCustomerDetails(paymentIntent, roastifyOrder);
  const roastifyStatus = roastifyOrder
    ? getRoastifyOrderStatus(roastifyOrder)
    : paymentIntent.metadata?.ritl_roastify_order_id
      ? paymentIntent.metadata?.ritl_fulfillment_status?.trim()
      : undefined;
  const tracking = roastifyOrder ? getRoastifyOrderTracking(roastifyOrder) : undefined;

  const stripeItemsSummary = buildItemsSummary(paymentIntent.metadata?.ritl_items);
  const stripeCustomerId =
    typeof paymentIntent.customer === "string"
      ? paymentIntent.customer
      : paymentIntent.customer?.id;

  return {
    id: paymentIntent.id,
    stripeCustomerId,
    customerName: customer.name,
    customerEmail: customer.email,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    createdAt: new Date(paymentIntent.created * 1000).toISOString(),
    itemsSummary:
      stripeItemsSummary !== "—"
        ? stripeItemsSummary
        : (roastifyOrder ? buildRoastifyItemsSummary(roastifyOrder) : undefined) ??
          "—",
    orderType: resolveOrderType(paymentIntent.metadata?.ritl_items),
    roastifyOrderId:
      roastifyOrder?.orderId ?? paymentIntent.metadata?.ritl_roastify_order_id,
    roastifyStatus,
    trackingNumber: tracking?.trackingNumber,
    trackingUrl: tracking?.trackingUrl,
    carrier: tracking?.carrier,
    roastifyUpdatedAt: roastifyOrder?.updatedAt,
  };
}

async function buildRoastifyOrderMap(
  roastifyOrderIds: string[]
): Promise<Map<string, RoastifyOrderDetail>> {
  const orderMap = new Map<string, RoastifyOrderDetail>();
  const roastifyOrders = await listRoastifyOrders();
  const neededIds = new Set(roastifyOrderIds);

  for (const order of roastifyOrders) {
    orderMap.set(order.orderId, order);
    neededIds.delete(order.orderId);
  }

  await Promise.allSettled(
    [...neededIds].map(async (orderId) => {
      const order = await getRoastifyOrder(orderId);
      orderMap.set(order.orderId, order);
    })
  );

  return orderMap;
}

export async function buildAdminOrdersFromPaymentIntents(
  paymentIntents: Stripe.PaymentIntent[]
): Promise<AdminOrderRow[]> {
  const succeeded = paymentIntents
    .filter((paymentIntent) => paymentIntent.status === "succeeded")
    .sort((left, right) => right.created - left.created);

  if (!isRoastifyConfigured()) {
    return succeeded.map((paymentIntent) => toAdminOrderRow(paymentIntent));
  }

  const roastifyOrderIds = succeeded
    .map((paymentIntent) => paymentIntent.metadata?.ritl_roastify_order_id?.trim())
    .filter((orderId): orderId is string => Boolean(orderId));

  let roastifyOrderMap = new Map<string, RoastifyOrderDetail>();

  try {
    roastifyOrderMap = await buildRoastifyOrderMap(roastifyOrderIds);
  } catch (error) {
    console.error("Roastify orders fetch failed:", error);
  }

  const rows = succeeded.map((paymentIntent) => {
    const roastifyOrderId = paymentIntent.metadata?.ritl_roastify_order_id?.trim();
    const roastifyOrder = roastifyOrderId
      ? roastifyOrderMap.get(roastifyOrderId)
      : undefined;

    return {
      paymentIntent,
      roastifyOrder,
    };
  });

  await Promise.allSettled(
    rows
      .filter((row) => row.roastifyOrder)
      .map(async (row) => {
        if (isOrdersDatabaseConfigured()) {
          const order = await getOrderByStripePaymentIntentId(row.paymentIntent.id);
          if (order?.roastify_order_id) {
            await syncOrderFulfillmentFromRoastify(order, row.roastifyOrder!);
            return;
          }
        }

        await syncRoastifyMetadataToStripe(row.paymentIntent, row.roastifyOrder!, {
          notifyCustomer: false,
          syncGhl: true,
        });
      })
  );

  return rows.map(({ paymentIntent, roastifyOrder }) =>
    toAdminOrderRow(paymentIntent, roastifyOrder)
  );
}

export const ADMIN_ORDER_PAGE_SIZES = [25, 50, 75, 100] as const;
export type AdminOrderPageSize = (typeof ADMIN_ORDER_PAGE_SIZES)[number];
export const DEFAULT_ADMIN_ORDER_PAGE_SIZE: AdminOrderPageSize = 25;

export const ADMIN_ORDER_SORT_FIELDS = [
  "customerName",
  "itemsSummary",
  "createdAt",
  "amount",
  "orderType",
  "roastifyStatus",
  "trackingNumber",
  "roastifyOrderId",
] as const;
export type AdminOrderSortField = (typeof ADMIN_ORDER_SORT_FIELDS)[number];
export type AdminOrderSortDirection = "asc" | "desc";
export const DEFAULT_ADMIN_ORDER_SORT_FIELD: AdminOrderSortField = "createdAt";
export const DEFAULT_ADMIN_ORDER_SORT_DIRECTION: AdminOrderSortDirection = "desc";

export interface AdminOrdersListResult {
  orders: AdminOrderRow[];
  total: number;
  page: number;
  pageSize: AdminOrderPageSize;
  totalPages: number;
  sortBy: AdminOrderSortField;
  sortDir: AdminOrderSortDirection;
}

export interface ListAdminOrdersOptions extends AdminOrderListFilters {
  query?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
}

function normalizeOrderPageSize(pageSize?: number): AdminOrderPageSize {
  if (
    pageSize === 25 ||
    pageSize === 50 ||
    pageSize === 75 ||
    pageSize === 100
  ) {
    return pageSize;
  }

  return DEFAULT_ADMIN_ORDER_PAGE_SIZE;
}

function normalizeOrderPage(page?: number): number {
  if (!page || !Number.isFinite(page) || page < 1) {
    return 1;
  }

  return Math.floor(page);
}

function normalizeOrderSortField(sortBy?: string): AdminOrderSortField {
  if (
    sortBy &&
    ADMIN_ORDER_SORT_FIELDS.includes(sortBy as AdminOrderSortField)
  ) {
    return sortBy as AdminOrderSortField;
  }

  return DEFAULT_ADMIN_ORDER_SORT_FIELD;
}

function normalizeOrderSortDirection(sortDir?: string): AdminOrderSortDirection {
  return sortDir === "asc" ? "asc" : "desc";
}

function compareOrderStrings(
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

function filterAdminOrders(
  orders: AdminOrderRow[],
  query?: string
): AdminOrderRow[] {
  const normalizedQuery = query?.trim().toLowerCase();
  if (!normalizedQuery) {
    return orders;
  }

  return orders.filter((order) => {
    const haystack = [
      order.customerName,
      order.customerEmail,
      order.itemsSummary,
      order.orderType,
      order.roastifyStatus,
      order.trackingNumber,
      order.carrier,
      order.roastifyOrderId,
      order.id,
      order.stripeCustomerId,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

function applyAdminOrderListFilters(
  orders: AdminOrderRow[],
  options: ListAdminOrdersOptions
): AdminOrderRow[] {
  let filtered = filterAdminOrders(orders, options.query);

  if (options.progress === "awaiting") {
    filtered = filtered.filter((order) => !order.roastifyStatus?.trim());
  } else if (options.progress === "canceled") {
    filtered = filtered.filter((order) => {
      const status = order.roastifyStatus?.trim().toLowerCase();
      return status === "canceled" || status === "cancelled";
    });
  } else if (options.progress) {
    filtered = filtered.filter(
      (order) =>
        order.roastifyStatus?.trim().toLowerCase() === options.progress?.toLowerCase()
    );
  }

  if (options.productId) {
    const product = getProduct(options.productId);
    const productName = product?.name.toLowerCase();
    filtered = filtered.filter((order) => {
      const summary = order.itemsSummary.toLowerCase();
      return (
        summary.includes(options.productId!.toLowerCase()) ||
        (productName ? summary.includes(productName) : false)
      );
    });
  }

  if (options.orderType === "unknown") {
    filtered = filtered.filter((order) => !order.orderType);
  } else if (options.orderType && isAdminOrderTypeFilter(options.orderType)) {
    filtered = filtered.filter((order) => order.orderType === options.orderType);
  }

  const dateFrom = normalizeAdminOrderDateFilter(options.dateFrom);
  if (dateFrom) {
    const from = toOrderFilterDateStart(dateFrom);
    filtered = filtered.filter((order) => order.createdAt >= from);
  }

  const dateTo = normalizeAdminOrderDateFilter(options.dateTo);
  if (dateTo) {
    const to = toOrderFilterDateEnd(dateTo);
    filtered = filtered.filter((order) => order.createdAt <= to);
  }

  return filtered;
}

function sortAdminOrders(
  orders: AdminOrderRow[],
  sortBy: AdminOrderSortField,
  sortDir: AdminOrderSortDirection
): AdminOrderRow[] {
  const direction = sortDir === "asc" ? 1 : -1;

  return [...orders].sort((left, right) => {
    let comparison = 0;

    switch (sortBy) {
      case "customerName":
        comparison = compareOrderStrings(left.customerName, right.customerName);
        break;
      case "itemsSummary":
        comparison = compareOrderStrings(left.itemsSummary, right.itemsSummary);
        break;
      case "createdAt":
        comparison = compareOrderStrings(left.createdAt, right.createdAt);
        break;
      case "amount":
        comparison = left.amount - right.amount;
        break;
      case "orderType":
        comparison = compareOrderStrings(left.orderType, right.orderType, true);
        break;
      case "roastifyStatus":
        comparison = compareOrderStrings(
          left.roastifyStatus,
          right.roastifyStatus,
          true
        );
        break;
      case "trackingNumber":
        comparison = compareOrderStrings(
          left.trackingNumber,
          right.trackingNumber,
          true
        );
        break;
      case "roastifyOrderId":
        comparison = compareOrderStrings(
          left.roastifyOrderId,
          right.roastifyOrderId,
          true
        );
        break;
    }

    if (comparison === 0) {
      comparison = compareOrderStrings(right.createdAt, left.createdAt);
    }

    return comparison * direction;
  });
}

async function listAllPaymentIntents(): Promise<Stripe.PaymentIntent[]> {
  const stripe = getStripe();
  const paymentIntents: Stripe.PaymentIntent[] = [];
  let startingAfter: string | undefined;

  while (true) {
    const page = await stripe.paymentIntents.list({
      limit: 100,
      expand: ["data.customer"],
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    paymentIntents.push(...page.data);

    if (!page.has_more || page.data.length === 0) {
      break;
    }

    startingAfter = page.data[page.data.length - 1]?.id;
  }

  return paymentIntents;
}

export async function listAdminOrders(
  options: ListAdminOrdersOptions = {}
): Promise<AdminOrdersListResult> {
  const page = normalizeOrderPage(options.page);
  const pageSize = normalizeOrderPageSize(options.pageSize);
  const sortBy = normalizeOrderSortField(options.sortBy);
  const sortDir = normalizeOrderSortDirection(options.sortDir);

  if (isOrdersDatabaseConfigured()) {
    try {
      const { orders, total } = await listOrders({
        query: options.query,
        page,
        pageSize,
        sortBy,
        sortDir,
        source: "website",
        progress: options.progress,
        productId: options.productId,
        orderType: options.orderType,
        dateFrom: normalizeAdminOrderDateFilter(options.dateFrom),
        dateTo: normalizeAdminOrderDateFilter(options.dateTo),
      });

      const syncedOrders = await syncOrdersFromRoastify(orders);

      const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
      const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);

      return {
        orders: syncedOrders.map(orderRecordToAdminRow),
        total,
        page: currentPage,
        pageSize,
        totalPages,
        sortBy,
        sortDir,
      };
    } catch (error) {
      console.error("Supabase orders list failed, falling back to Stripe:", error);
    }
  }

  if (!isStripeSecretConfigured()) {
    return {
      orders: [],
      total: 0,
      page: 1,
      pageSize: DEFAULT_ADMIN_ORDER_PAGE_SIZE,
      totalPages: 0,
      sortBy: DEFAULT_ADMIN_ORDER_SORT_FIELD,
      sortDir: DEFAULT_ADMIN_ORDER_SORT_DIRECTION,
    };
  }

  const paymentIntents = await listAllPaymentIntents();
  const allOrders = await buildAdminOrdersFromPaymentIntents(paymentIntents);
  const filteredOrders = applyAdminOrderListFilters(allOrders, options);
  const sortedOrders = sortAdminOrders(filteredOrders, sortBy, sortDir);
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

export async function getAdminOrder(orderId: string): Promise<AdminOrderDetail | null> {
  if (isOrdersDatabaseConfigured()) {
    try {
      const order = await getOrderById(orderId);
      if (order) {
        if (order.roastify_order_id && isRoastifyConfigured()) {
          try {
            const roastifyOrder = await getRoastifyOrder(order.roastify_order_id);
            const synced = await syncOrderFulfillmentFromRoastify(order, roastifyOrder);
            return orderRecordToAdminDetail(synced.order);
          } catch (error) {
            console.error(`Roastify sync failed for order ${orderId}:`, error);
          }
        }

        return orderRecordToAdminDetail(order);
      }
    } catch (error) {
      console.error("Supabase order lookup failed, falling back to Stripe:", error);
    }
  }

  if (!isStripeSecretConfigured()) {
    return null;
  }

  const stripe = getStripe();

  let paymentIntent: Stripe.PaymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(orderId, {
      expand: ["customer"],
    });
  } catch {
    return null;
  }

  if (paymentIntent.status !== "succeeded") {
    return null;
  }

  let roastifyOrder: RoastifyOrderDetail | undefined;
  const roastifyOrderId = paymentIntent.metadata?.ritl_roastify_order_id?.trim();

  if (isRoastifyConfigured() && roastifyOrderId) {
    try {
      roastifyOrder = await getRoastifyOrder(roastifyOrderId);
      await syncRoastifyMetadataToStripe(paymentIntent, roastifyOrder, {
        notifyCustomer: false,
        syncGhl: true,
      });
    } catch (error) {
      console.error(`Roastify order fetch failed for ${roastifyOrderId}:`, error);
    }
  }

  return toAdminOrderDetail(paymentIntent, roastifyOrder);
}

const CURRENT_ORDER_STATUSES = new Set([
  "created",
  "picked",
  "printed",
  "packaged",
]);

function normalizeRoastifyStatus(status?: string): string | undefined {
  const normalized = status?.trim().toLowerCase();
  return normalized || undefined;
}

export function isCurrentRoastifyOrder(order: AdminOrderRow): boolean {
  const status = normalizeRoastifyStatus(order.roastifyStatus);

  if (status === "shipped") {
    return false;
  }

  if (!status) {
    return true;
  }

  return CURRENT_ORDER_STATUSES.has(status);
}

export function isShippedRoastifyOrder(order: AdminOrderRow): boolean {
  return normalizeRoastifyStatus(order.roastifyStatus) === "shipped";
}

export function filterCurrentRoastifyOrders(orders: AdminOrderRow[]): AdminOrderRow[] {
  return orders.filter(isCurrentRoastifyOrder);
}

export function filterShippedRoastifyOrders(orders: AdminOrderRow[]): AdminOrderRow[] {
  return orders.filter(isShippedRoastifyOrder);
}
