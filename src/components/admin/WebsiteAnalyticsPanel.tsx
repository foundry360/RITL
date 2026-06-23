"use client";

import { useCallback, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WebsiteAnalyticsData } from "@/lib/analytics/ga-data";
import { Button, ButtonLink } from "@/components/ui/Button";
import {
  orderTableCellClass,
  orderTableClass,
  orderTableHeaderClass,
} from "@/components/admin/orderTable";

interface WebsiteAnalyticsPanelProps {
  initialAnalytics: WebsiteAnalyticsData;
  googleAnalyticsUrl?: string;
}

const CHART_COLORS = {
  users: "#c7cbd3",
  sessions: "#e85d24",
  pageViews: "#7dd3fc",
  grid: "#2b2f36",
  axis: "#6e7480",
};

function formatAnalyticsTimestamp(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}m ${remainder}s`;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-[8px] border border-graphite bg-near-black px-3 py-2 text-xs shadow-lg">
      <p className="mb-2 text-text-muted">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <p key={entry.name} className="text-text-primary">
            <span style={{ color: entry.color }}>{entry.name}</span>
            {": "}
            {formatCompactNumber(entry.value ?? 0)}
          </p>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-[8px] border border-graphite bg-soft-black/40 p-5">
      <p className="text-[10px] tracking-[0.18em] uppercase text-text-muted">{label}</p>
      <p className="mt-3 text-2xl font-light tracking-tight text-text-primary">{value}</p>
      {detail ? (
        <p className="mt-2 text-xs leading-relaxed text-text-secondary">{detail}</p>
      ) : null}
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[8px] border border-graphite bg-soft-black/40 p-5">
      <h2 className="text-sm font-medium tracking-wide text-text-primary">{title}</h2>
      <div className="mt-5 h-72 w-full min-w-0">{children}</div>
    </section>
  );
}

export function WebsiteAnalyticsPanel({
  initialAnalytics,
  googleAnalyticsUrl,
}: WebsiteAnalyticsPanelProps) {
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/analytics");
      if (!response.ok) {
        throw new Error("Failed to refresh analytics");
      }

      const nextAnalytics = (await response.json()) as WebsiteAnalyticsData;
      setAnalytics(nextAnalytics);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Failed to refresh analytics"
      );
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 border-b border-graphite pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-text-muted">
            Website
          </p>
          <h1 className="mt-2 text-2xl font-light tracking-tight text-text-primary">
            Analytics
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {analytics.dateRangeLabel} · Updated{" "}
            {formatAnalyticsTimestamp(analytics.generatedAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {googleAnalyticsUrl ? (
            <ButtonLink
              href={googleAnalyticsUrl}
              variant="outline"
              size="sm"
              className="inline-flex"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open GA4
            </ButtonLink>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={isRefreshing}>
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-[8px] border border-graphite bg-soft-black/40 px-4 py-3 text-sm text-text-secondary">
          {error}
        </div>
      ) : null}

      {!analytics.configured && analytics.setupMessage ? (
        <div className="rounded-[8px] border border-graphite bg-soft-black/40 p-6">
          <h2 className="text-sm font-medium tracking-wide text-text-primary">
            Google Analytics setup required
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-secondary">
            {analytics.setupMessage}
          </p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-text-secondary">
            <li>Enable the Google Analytics Data API in Google Cloud.</li>
            <li>Create a service account and download its private key.</li>
            <li>
              Add the service account email as a <strong className="text-text-primary">Viewer</strong>{" "}
              on the GA4 property.
            </li>
            <li>
              Set <code className="text-text-primary">GOOGLE_ANALYTICS_PROPERTY_ID</code>,{" "}
              <code className="text-text-primary">GOOGLE_SERVICE_ACCOUNT_EMAIL</code>, and{" "}
              <code className="text-text-primary">GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY</code> in
              your environment.
            </li>
          </ol>
        </div>
      ) : null}

      {analytics.configured ? (
        <>
      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Active users · 30 min"
          value={formatCompactNumber(analytics.realtime.activeUsersLast30Minutes)}
          detail="Users in the last 30 minutes"
        />
        <StatCard
          label="Active users · 5 min"
          value={formatCompactNumber(analytics.realtime.activeUsersLast5Minutes)}
          detail="Users in the last 5 minutes"
        />
      </section>

      <section className="rounded-[8px] border border-graphite bg-soft-black/40 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-medium tracking-wide text-text-primary">
              Views by page title and screen name
            </h2>
            <p className="mt-1 text-xs text-text-secondary">
              {analytics.dateRangeLabel}
            </p>
          </div>
        </div>

        {analytics.pageTitles.length > 0 ? (
          <div className="mt-5 overflow-x-auto">
            <table className={orderTableClass}>
              <thead>
                <tr className="border-b border-graphite">
                  <th className={`${orderTableHeaderClass} w-[42%]`}>Page title</th>
                  <th className={`${orderTableHeaderClass} w-[42%]`}>Screen name</th>
                  <th className={`${orderTableHeaderClass} w-[16%] text-right`}>Views</th>
                </tr>
              </thead>
              <tbody>
                {analytics.pageTitles.map((page) => (
                  <tr
                    key={`${page.pageTitle}:${page.screenName}`}
                    className="border-b border-graphite/60 last:border-b-0 transition-colors hover:bg-graphite/20"
                  >
                    <td className={`${orderTableCellClass} text-text-primary`}>
                      {page.pageTitle}
                    </td>
                    <td className={orderTableCellClass}>{page.screenName}</td>
                    <td className={`${orderTableCellClass} text-right tabular-nums text-text-primary`}>
                      {formatCompactNumber(page.pageViews)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-5 text-sm text-text-secondary">No page views in this period yet.</p>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Users"
          value={formatCompactNumber(analytics.overview.users)}
          detail="Active users in range"
        />
        <StatCard
          label="Sessions"
          value={formatCompactNumber(analytics.overview.sessions)}
          detail="Total sessions"
        />
        <StatCard
          label="Page views"
          value={formatCompactNumber(analytics.overview.pageViews)}
          detail="Screen/page views"
        />
        <StatCard
          label="Avg session"
          value={formatDuration(analytics.overview.avgSessionDurationSeconds)}
          detail="Average session duration"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Traffic trend">
          <ResponsiveContainer width="100%" height={288}>
            <LineChart data={analytics.dailyTrend}>
              <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="users"
                name="Users"
                stroke={CHART_COLORS.users}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="sessions"
                name="Sessions"
                stroke={CHART_COLORS.sessions}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Page views by day">
          <ResponsiveContainer width="100%" height={288}>
            <BarChart data={analytics.dailyTrend}>
              <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="pageViews"
                name="Page views"
                fill={CHART_COLORS.pageViews}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Top pages">
          <ResponsiveContainer width="100%" height={288}>
            <BarChart data={analytics.topPages} layout="vertical" margin={{ left: 4, right: 12 }}>
              <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="pageTitle"
                width={96}
                tick={{ fill: CHART_COLORS.axis, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: string) =>
                  value.length > 16 ? `${value.slice(0, 16)}…` : value
                }
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="pageViews"
                name="Page views"
                fill={CHART_COLORS.sessions}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Traffic channels">
          <ResponsiveContainer width="100%" height={288}>
            <BarChart data={analytics.channels}>
              <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="channel"
                tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="sessions"
                name="Sessions"
                fill={CHART_COLORS.users}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Devices">
          <ResponsiveContainer width="100%" height={288}>
            <BarChart data={analytics.devices}>
              <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="device"
                tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="sessions"
                name="Sessions"
                fill={CHART_COLORS.pageViews}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>
        </>
      ) : null}
    </div>
  );
}
