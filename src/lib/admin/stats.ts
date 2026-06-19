import { listAdminOrders } from "@/lib/admin/orders";
import { listAdminWholesaleOrders } from "@/lib/admin/wholesale";
import {
  FULFILLMENT_PROGRESS_STEPS,
  normalizeRoastifyProgressStatus,
} from "@/lib/roastify/fulfillment-progress";
import { isOrdersDatabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const DASHBOARD_TIME_RANGES = [7, 30, 60, 90] as const;
export type DashboardTimeRange = (typeof DASHBOARD_TIME_RANGES)[number];
export const DEFAULT_DASHBOARD_TIME_RANGE: DashboardTimeRange = 30;

export interface AdminDashboardFulfillmentByStage {
  awaiting: number;
  created: number;
  picked: number;
  printed: number;
  packaged: number;
  shipped: number;
  canceled: number;
}

export const DASHBOARD_FULFILLMENT_STAGES = [
  "awaiting",
  ...FULFILLMENT_PROGRESS_STEPS,
  "canceled",
] as const;

export type DashboardFulfillmentStage = (typeof DASHBOARD_FULFILLMENT_STAGES)[number];

export function createEmptyFulfillmentByStage(): AdminDashboardFulfillmentByStage {
  return {
    awaiting: 0,
    created: 0,
    picked: 0,
    printed: 0,
    packaged: 0,
    shipped: 0,
    canceled: 0,
  };
}

export interface AdminDashboardRecentOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  amountCents: number;
  createdAt: string;
  fulfillmentStatus?: string;
}

export interface AdminDashboardStats {
  generatedAt: string;
  days: DashboardTimeRange;
  revenue: {
    periodCents: number;
    allTimeCents: number;
  };
  orders: {
    period: number;
    allTime: number;
    fulfillmentByStage: AdminDashboardFulfillmentByStage;
    byType: {
      oneTime: number;
      subscription: number;
      mixed: number;
      unknown: number;
    };
  };
  customers: number;
  wholesale: {
    period: number;
    inPipeline: number;
  };
  abandonedCheckouts: {
    open: number;
    converted: number;
    openValueCents: number;
  };
  recentOrders: AdminDashboardRecentOrder[];
  dataSource: "supabase" | "stripe";
}

interface OrderSummaryRow {
  amount_cents: number;
  created_at: string;
  fulfillment_status: string | null;
  order_type: string | null;
  customer_name: string | null;
  customer_email: string | null;
  id: string;
  stripe_customer_id: string | null;
}

export function normalizeDashboardDays(value?: number): DashboardTimeRange {
  if (value === 7 || value === 30 || value === 60 || value === 90) {
    return value;
  }

  return DEFAULT_DASHBOARD_TIME_RANGE;
}

function startOfDaysAgo(days: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function isInPipelineStatus(status?: string | null): boolean {
  const normalized = normalizeRoastifyProgressStatus(status);
  if (!normalized || normalized === "shipped" || normalized === "canceled") {
    return false;
  }

  return FULFILLMENT_PROGRESS_STEPS.slice(0, -1).includes(normalized);
}

function incrementFulfillmentStage(
  counts: AdminDashboardFulfillmentByStage,
  status?: string | null
): void {
  const normalized = normalizeRoastifyProgressStatus(status);

  if (!normalized) {
    counts.awaiting += 1;
    return;
  }

  if (normalized === "canceled") {
    counts.canceled += 1;
    return;
  }

  counts[normalized] += 1;
}

function countPipelineOrders(orders: Array<{ roastifyStatus?: string }>): number {
  return orders.filter((order) => isInPipelineStatus(order.roastifyStatus)).length;
}

function filterRowsByPeriod(rows: OrderSummaryRow[], days: DashboardTimeRange): OrderSummaryRow[] {
  const periodStart = startOfDaysAgo(days);
  return rows.filter((row) => row.created_at >= periodStart);
}

function mapRecentOrders(rows: OrderSummaryRow[]): AdminDashboardRecentOrder[] {
  return rows.slice(0, 5).map((row) => ({
    id: row.id,
    customerName: row.customer_name?.trim() || "Guest",
    customerEmail: row.customer_email?.trim() || "—",
    amountCents: row.amount_cents ?? 0,
    createdAt: row.created_at,
    fulfillmentStatus: row.fulfillment_status ?? undefined,
  }));
}

function buildStatsFromOrderRows(
  allRows: OrderSummaryRow[],
  days: DashboardTimeRange
): Pick<AdminDashboardStats, "revenue" | "orders" | "customers" | "recentOrders"> {
  const periodRows = filterRowsByPeriod(allRows, days);
  const customerIds = new Set<string>();
  const fulfillmentByStage = createEmptyFulfillmentByStage();
  const byType = {
    oneTime: 0,
    subscription: 0,
    mixed: 0,
    unknown: 0,
  };

  let periodCents = 0;
  let allTimeCents = 0;

  for (const row of allRows) {
    allTimeCents += row.amount_cents ?? 0;
  }

  for (const row of periodRows) {
    const amount = row.amount_cents ?? 0;
    periodCents += amount;

    incrementFulfillmentStage(fulfillmentByStage, row.fulfillment_status);

    if (row.order_type === "one-time") {
      byType.oneTime += 1;
    } else if (row.order_type === "subscription") {
      byType.subscription += 1;
    } else if (row.order_type === "mixed") {
      byType.mixed += 1;
    } else {
      byType.unknown += 1;
    }

    const customerKey =
      row.stripe_customer_id?.trim() ||
      row.customer_email?.trim().toLowerCase() ||
      row.id;
    customerIds.add(customerKey);
  }

  return {
    revenue: {
      periodCents,
      allTimeCents,
    },
    orders: {
      period: periodRows.length,
      allTime: allRows.length,
      fulfillmentByStage,
      byType,
    },
    customers: customerIds.size,
    recentOrders: mapRecentOrders(periodRows),
  };
}

function filterWholesaleOrdersByPeriod<T extends { createdAt: string }>(
  orders: T[],
  days: DashboardTimeRange
): T[] {
  const periodStart = startOfDaysAgo(days);
  return orders.filter((order) => order.createdAt >= periodStart);
}

async function getAbandonedCheckoutStats(): Promise<
  AdminDashboardStats["abandonedCheckouts"]
> {
  if (!isOrdersDatabaseConfigured()) {
    return { open: 0, converted: 0, openValueCents: 0 };
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("abandoned_checkouts")
    .select("amount_cents, converted_at");

  if (error) {
    throw new Error(error.message);
  }

  let open = 0;
  let converted = 0;
  let openValueCents = 0;

  for (const row of data ?? []) {
    const amount =
      typeof row.amount_cents === "number"
        ? row.amount_cents
        : Number(row.amount_cents ?? 0);

    if (row.converted_at) {
      converted += 1;
    } else {
      open += 1;
      openValueCents += amount;
    }
  }

  return { open, converted, openValueCents };
}

async function getSupabaseDashboardStats(
  days: DashboardTimeRange
): Promise<AdminDashboardStats> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, amount_cents, created_at, fulfillment_status, order_type, customer_name, customer_email, stripe_customer_id"
    )
    .eq("source", "website")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as OrderSummaryRow[];

  const [coreStats, abandonedCheckouts, wholesaleResult] = await Promise.all([
    Promise.resolve(buildStatsFromOrderRows(rows, days)),
    getAbandonedCheckoutStats(),
    listAdminWholesaleOrders({ page: 1, pageSize: 100 }),
  ]);

  const periodWholesaleOrders = filterWholesaleOrdersByPeriod(wholesaleResult.orders, days);

  return {
    generatedAt: new Date().toISOString(),
    days,
    ...coreStats,
    wholesale: {
      period: periodWholesaleOrders.length,
      inPipeline: countPipelineOrders(periodWholesaleOrders),
    },
    abandonedCheckouts,
    dataSource: "supabase",
  };
}

async function getStripeDashboardStats(
  days: DashboardTimeRange
): Promise<AdminDashboardStats> {
  const [ordersResult, wholesaleResult, abandonedCheckouts] = await Promise.all([
    listAdminOrders({ page: 1, pageSize: 100, sortBy: "createdAt", sortDir: "desc" }),
    listAdminWholesaleOrders({ page: 1, pageSize: 100 }),
    getAbandonedCheckoutStats(),
  ]);

  const rows: OrderSummaryRow[] = ordersResult.orders.map((order) => ({
    id: order.id,
    amount_cents: order.amount,
    created_at: order.createdAt,
    fulfillment_status: order.roastifyStatus ?? null,
    order_type: order.orderType ?? null,
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    stripe_customer_id: order.stripeCustomerId ?? null,
  }));

  const coreStats = buildStatsFromOrderRows(rows, days);
  const periodWholesaleOrders = filterWholesaleOrdersByPeriod(wholesaleResult.orders, days);

  return {
    generatedAt: new Date().toISOString(),
    days,
    ...coreStats,
    orders: {
      ...coreStats.orders,
      allTime: ordersResult.total,
    },
    wholesale: {
      period: periodWholesaleOrders.length,
      inPipeline: countPipelineOrders(periodWholesaleOrders),
    },
    abandonedCheckouts,
    dataSource: "stripe",
  };
}

export async function getAdminDashboardStats(
  days: DashboardTimeRange = DEFAULT_DASHBOARD_TIME_RANGE
): Promise<AdminDashboardStats> {
  const normalizedDays = normalizeDashboardDays(days);

  if (isOrdersDatabaseConfigured()) {
    try {
      return await getSupabaseDashboardStats(normalizedDays);
    } catch (error) {
      console.error("Supabase dashboard stats failed, falling back to Stripe:", error);
    }
  }

  return getStripeDashboardStats(normalizedDays);
}
