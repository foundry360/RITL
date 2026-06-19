"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { FulfillmentProgressSteps } from "@/components/admin/FulfillmentProgressSteps";
import { formatOrderTypeLabel } from "@/lib/admin/format";
import {
  DASHBOARD_FULFILLMENT_STAGES,
  DASHBOARD_TIME_RANGES,
  type AdminDashboardStats,
  type DashboardFulfillmentStage,
  type DashboardTimeRange,
} from "@/lib/admin/stats";
import { formatPrice } from "@/lib/checkout/format";
import {
  formatRoastifyStatusLabel,
  getRoastifyStatusColors,
} from "@/lib/roastify/fulfillment-progress";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface DashboardPanelProps {
  initialStats: AdminDashboardStats;
}

function formatDashboardDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

function StatCard({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: string;
  detail?: string;
  href?: string;
}) {
  const content = (
    <div
      className={cn(
        "rounded-[8px] border border-graphite bg-soft-black/40 p-5 transition-colors",
        href && "hover:border-steel-silver/30 hover:bg-soft-black/60"
      )}
    >
      <p className="text-[10px] tracking-[0.18em] uppercase text-text-muted">{label}</p>
      <p className="mt-3 text-2xl font-light tracking-tight text-text-primary">{value}</p>
      {detail ? (
        <p className="mt-2 text-xs leading-relaxed text-text-secondary">{detail}</p>
      ) : null}
    </div>
  );

  if (!href) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}

function getFulfillmentStageLabel(stage: DashboardFulfillmentStage): string {
  if (stage === "awaiting") {
    return "Awaiting";
  }

  return formatRoastifyStatusLabel(stage);
}

function FulfillmentStageCard({
  stage,
  count,
}: {
  stage: DashboardFulfillmentStage;
  count: number;
}) {
  const colors =
    stage === "awaiting"
      ? {
          dot: "#6E7480",
          badgeBg: "rgba(110, 116, 128, 0.14)",
          badgeRing: "rgba(110, 116, 128, 0.38)",
          badgeText: "#A7ADB8",
        }
      : getRoastifyStatusColors(stage);

  return (
    <div
      className="rounded-[8px] border px-3 py-3"
      style={{
        backgroundColor: colors.badgeBg,
        borderColor: colors.badgeRing,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: colors.dot }}
        />
        <p
          className="text-[10px] tracking-[0.14em] uppercase"
          style={{ color: colors.badgeText }}
        >
          {getFulfillmentStageLabel(stage)}
        </p>
      </div>
      <p className="mt-2 text-xl font-light text-text-primary">{count}</p>
    </div>
  );
}

export function DashboardPanel({ initialStats }: DashboardPanelProps) {
  const [stats, setStats] = useState(initialStats);
  const [days, setDays] = useState<DashboardTimeRange>(initialStats.days);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async (range: DashboardTimeRange) => {
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/dashboard?days=${range}`);
      if (!response.ok) {
        throw new Error("Failed to refresh dashboard");
      }

      const nextStats = (await response.json()) as AdminDashboardStats;
      setStats(nextStats);
      setDays(nextStats.days);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error ? refreshError.message : "Failed to refresh dashboard"
      );
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleRangeChange = useCallback(
    (range: DashboardTimeRange) => {
      if (range === days || isRefreshing) {
        return;
      }

      setDays(range);
      void loadStats(range);
    },
    [days, isRefreshing, loadStats]
  );

  const refresh = useCallback(() => {
    void loadStats(days);
  }, [days, loadStats]);

  const orderTypeEntries = [
    { key: "oneTime", label: formatOrderTypeLabel("one-time") },
    { key: "subscription", label: formatOrderTypeLabel("subscription") },
    { key: "mixed", label: formatOrderTypeLabel("mixed") },
    { key: "unknown", label: "Unspecified" },
  ] as const;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 border-b border-graphite pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-text-muted">Overview</p>
          <h1 className="mt-2 text-2xl font-light tracking-tight text-text-primary">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Last {stats.days} days · Updated {formatDashboardDate(stats.generatedAt)}
            {stats.dataSource === "stripe" ? " · Stripe fallback data" : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex rounded-[8px] border border-graphite p-1"
            role="group"
            aria-label="Dashboard time range"
          >
            {DASHBOARD_TIME_RANGES.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => handleRangeChange(range)}
                disabled={isRefreshing}
                className={cn(
                  "rounded-[6px] px-3 py-1.5 text-xs tracking-[0.12em] uppercase transition-colors disabled:opacity-50",
                  days === range
                    ? "bg-graphite text-text-primary"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                {range}d
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={refresh} disabled={isRefreshing}>
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-[8px] border border-graphite bg-soft-black/40 px-4 py-3 text-sm text-text-secondary">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatPrice(stats.revenue.periodCents / 100)}
          detail={`${formatPrice(stats.revenue.allTimeCents / 100)} all time`}
          href="/admin/orders"
        />
        <StatCard
          label="Orders"
          value={String(stats.orders.period)}
          detail={`${stats.orders.allTime} total orders`}
          href="/admin/orders"
        />
        <StatCard
          label="Customers"
          value={String(stats.customers)}
          detail="Distinct buyers in selected range"
          href="/admin/customers"
        />
        <StatCard
          label="Open abandoned carts"
          value={String(stats.abandonedCheckouts.open)}
          detail={
            stats.abandonedCheckouts.openValueCents > 0
              ? `${formatPrice(stats.abandonedCheckouts.openValueCents / 100)} potential recovery`
              : `${stats.abandonedCheckouts.converted} recovered`
          }
        />
      </section>

      <section className="rounded-[8px] border border-graphite bg-soft-black/40 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium tracking-wide text-text-primary">
            Fulfillment pipeline
          </h2>
          <Link
            href="/admin/orders"
            className="text-[10px] tracking-[0.14em] uppercase text-text-muted transition-colors hover:text-text-primary"
          >
            View orders
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
          {DASHBOARD_FULFILLMENT_STAGES.map((stage) => (
            <FulfillmentStageCard
              key={stage}
              stage={stage}
              count={stats.orders.fulfillmentByStage[stage]}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[8px] border border-graphite bg-soft-black/40 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium tracking-wide text-text-primary">
              Wholesale & order mix
            </h2>
            <Link
              href="/admin/wholesale"
              className="text-[10px] tracking-[0.14em] uppercase text-text-muted transition-colors hover:text-text-primary"
            >
              View wholesale
            </Link>
          </div>

          <div className="mt-5 rounded-[8px] border border-graphite/70 bg-near-black px-4 py-3">
            <p className="text-[10px] tracking-[0.14em] uppercase text-text-muted">Wholesale</p>
            <p className="mt-2 text-xl font-light text-text-primary">{stats.wholesale.period}</p>
            <p className="mt-1 text-xs text-text-secondary">
              {stats.wholesale.inPipeline} in pipeline
            </p>
          </div>

          <ul className="mt-5 space-y-2 border-t border-graphite pt-4">
            {orderTypeEntries.map(({ key, label }) => (
              <li key={key} className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">{label}</span>
                <span className="text-text-primary">{stats.orders.byType[key]}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[8px] border border-graphite bg-soft-black/40 p-5">
          <h2 className="text-sm font-medium tracking-wide text-text-primary">Revenue snapshot</h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[8px] border border-graphite/70 bg-near-black px-4 py-3">
              <p className="text-[10px] tracking-[0.14em] uppercase text-text-muted">
                Period revenue
              </p>
              <p className="mt-2 text-xl font-light text-text-primary">
                {formatPrice(stats.revenue.periodCents / 100)}
              </p>
            </div>
            <div className="rounded-[8px] border border-graphite/70 bg-near-black px-4 py-3">
              <p className="text-[10px] tracking-[0.14em] uppercase text-text-muted">All-time revenue</p>
              <p className="mt-2 text-xl font-light text-text-primary">
                {formatPrice(stats.revenue.allTimeCents / 100)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[8px] border border-graphite bg-soft-black/40">
        <div className="flex items-center justify-between gap-3 border-b border-graphite px-5 py-4">
          <h2 className="text-sm font-medium tracking-wide text-text-primary">Recent orders</h2>
          <Link
            href="/admin/orders"
            className="text-[10px] tracking-[0.14em] uppercase text-text-muted transition-colors hover:text-text-primary"
          >
            All orders
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-text-secondary">
            No website orders in the last {stats.days} days.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-graphite text-[10px] tracking-[0.14em] uppercase text-text-muted">
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-graphite/60 last:border-b-0 transition-colors hover:bg-graphite/20"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="block transition-colors hover:text-text-primary"
                      >
                        <span className="text-text-primary">{order.customerName}</span>
                        <span className="mt-1 block text-xs text-text-muted">
                          {order.customerEmail}
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-text-secondary">
                      {formatDashboardDate(order.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-text-primary">
                      {formatPrice(order.amountCents / 100)}
                    </td>
                    <td className="px-5 py-4">
                      <FulfillmentProgressSteps status={order.fulfillmentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
