import { BetaAnalyticsDataClient } from "@google-analytics/data";
import {
  getGoogleAnalyticsPropertyId,
  getGoogleServiceAccountCredentials,
  isGoogleAnalyticsDataConfigured,
} from "@/lib/analytics/ga-credentials";
import {
  DEFAULT_DASHBOARD_TIME_RANGE,
  normalizeDashboardDays,
  type DashboardTimeRange,
} from "@/lib/admin/stats";

export interface WebsiteAnalyticsOverview {
  users: number;
  sessions: number;
  pageViews: number;
  avgSessionDurationSeconds: number;
}

export interface WebsiteAnalyticsDailyPoint {
  date: string;
  label: string;
  users: number;
  sessions: number;
  pageViews: number;
}

export interface WebsiteAnalyticsPageRow {
  path: string;
  pageViews: number;
  users: number;
}

export interface WebsiteAnalyticsDeviceRow {
  device: string;
  sessions: number;
}

export interface WebsiteAnalyticsChannelRow {
  channel: string;
  sessions: number;
}

export interface WebsiteAnalyticsData {
  generatedAt: string;
  days: DashboardTimeRange;
  configured: boolean;
  overview: WebsiteAnalyticsOverview;
  dailyTrend: WebsiteAnalyticsDailyPoint[];
  topPages: WebsiteAnalyticsPageRow[];
  devices: WebsiteAnalyticsDeviceRow[];
  channels: WebsiteAnalyticsChannelRow[];
  setupMessage?: string;
}

function createEmptyOverview(): WebsiteAnalyticsOverview {
  return {
    users: 0,
    sessions: 0,
    pageViews: 0,
    avgSessionDurationSeconds: 0,
  };
}

function createEmptyAnalyticsData(days: DashboardTimeRange): WebsiteAnalyticsData {
  return {
    generatedAt: new Date().toISOString(),
    days,
    configured: false,
    overview: createEmptyOverview(),
    dailyTrend: [],
    topPages: [],
    devices: [],
    channels: [],
    setupMessage:
      "Google Analytics Data API is not configured. Add GOOGLE_ANALYTICS_PROPERTY_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, then grant the service account Viewer access in GA4.",
  };
}

function parseMetricValue(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatGaDateLabel(value: string): string {
  if (value.length !== 8) {
    return value;
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6)) - 1;
  const day = Number(value.slice(6, 8));
  const date = new Date(Date.UTC(year, month, day));

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatGaDateIso(value: string): string {
  if (value.length !== 8) {
    return value;
  }

  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function createAnalyticsClient(): BetaAnalyticsDataClient {
  const credentials = getGoogleServiceAccountCredentials();
  if (!credentials) {
    throw new Error("Google service account credentials are not configured.");
  }

  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: credentials.clientEmail,
      private_key: credentials.privateKey,
    },
  });
}

async function runGaReport(options: {
  days: DashboardTimeRange;
  dimensions: string[];
  metrics: string[];
  orderBys?: Array<{ dimension?: string; metric?: string; desc?: boolean }>;
  limit?: number;
}) {
  const propertyId = getGoogleAnalyticsPropertyId();
  if (!propertyId) {
    throw new Error("GOOGLE_ANALYTICS_PROPERTY_ID is not configured.");
  }

  const client = createAnalyticsClient();

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [
      {
        startDate: `${options.days}daysAgo`,
        endDate: "today",
      },
    ],
    dimensions: options.dimensions.map((name) => ({ name })),
    metrics: options.metrics.map((name) => ({ name })),
    orderBys: options.orderBys?.map((entry) => {
      if (entry.dimension) {
        return {
          dimension: { dimensionName: entry.dimension },
          desc: entry.desc ?? false,
        };
      }

      return {
        metric: { metricName: entry.metric! },
        desc: entry.desc ?? true,
      };
    }),
    limit: options.limit,
  });

  return response;
}

export async function getWebsiteAnalyticsData(
  days: DashboardTimeRange = DEFAULT_DASHBOARD_TIME_RANGE
): Promise<WebsiteAnalyticsData> {
  const normalizedDays = normalizeDashboardDays(days);

  if (!isGoogleAnalyticsDataConfigured()) {
    return createEmptyAnalyticsData(normalizedDays);
  }

  try {
    const [overviewReport, dailyReport, pagesReport, devicesReport, channelsReport] =
      await Promise.all([
        runGaReport({
          days: normalizedDays,
          dimensions: [],
          metrics: [
            "activeUsers",
            "sessions",
            "screenPageViews",
            "averageSessionDuration",
          ],
        }),
        runGaReport({
          days: normalizedDays,
          dimensions: ["date"],
          metrics: ["activeUsers", "sessions", "screenPageViews"],
          orderBys: [{ dimension: "date" }],
        }),
        runGaReport({
          days: normalizedDays,
          dimensions: ["pagePath"],
          metrics: ["screenPageViews", "activeUsers"],
          orderBys: [{ metric: "screenPageViews", desc: true }],
          limit: 8,
        }),
        runGaReport({
          days: normalizedDays,
          dimensions: ["deviceCategory"],
          metrics: ["sessions"],
          orderBys: [{ metric: "sessions", desc: true }],
          limit: 5,
        }),
        runGaReport({
          days: normalizedDays,
          dimensions: ["sessionDefaultChannelGroup"],
          metrics: ["sessions"],
          orderBys: [{ metric: "sessions", desc: true }],
          limit: 6,
        }),
      ]);

    const overviewRow = overviewReport.rows?.[0]?.metricValues ?? [];

    const overview: WebsiteAnalyticsOverview = {
      users: parseMetricValue(overviewRow[0]?.value),
      sessions: parseMetricValue(overviewRow[1]?.value),
      pageViews: parseMetricValue(overviewRow[2]?.value),
      avgSessionDurationSeconds: parseMetricValue(overviewRow[3]?.value),
    };

    const dailyTrend: WebsiteAnalyticsDailyPoint[] =
      dailyReport.rows?.map((row) => {
        const date = row.dimensionValues?.[0]?.value ?? "";
        const metrics = row.metricValues ?? [];

        return {
          date: formatGaDateIso(date),
          label: formatGaDateLabel(date),
          users: parseMetricValue(metrics[0]?.value),
          sessions: parseMetricValue(metrics[1]?.value),
          pageViews: parseMetricValue(metrics[2]?.value),
        };
      }) ?? [];

    const topPages: WebsiteAnalyticsPageRow[] =
      pagesReport.rows?.map((row) => {
        const metrics = row.metricValues ?? [];

        return {
          path: row.dimensionValues?.[0]?.value ?? "—",
          pageViews: parseMetricValue(metrics[0]?.value),
          users: parseMetricValue(metrics[1]?.value),
        };
      }) ?? [];

    const devices: WebsiteAnalyticsDeviceRow[] =
      devicesReport.rows?.map((row) => ({
        device: titleCase(row.dimensionValues?.[0]?.value ?? "Unknown"),
        sessions: parseMetricValue(row.metricValues?.[0]?.value),
      })) ?? [];

    const channels: WebsiteAnalyticsChannelRow[] =
      channelsReport.rows?.map((row) => ({
        channel: titleCase(row.dimensionValues?.[0]?.value ?? "Unknown"),
        sessions: parseMetricValue(row.metricValues?.[0]?.value),
      })) ?? [];

    return {
      generatedAt: new Date().toISOString(),
      days: normalizedDays,
      configured: true,
      overview,
      dailyTrend,
      topPages,
      devices,
      channels,
    };
  } catch (error) {
    console.error("Google Analytics data fetch failed:", error);

    return {
      ...createEmptyAnalyticsData(normalizedDays),
      setupMessage:
        error instanceof Error
          ? error.message
          : "Failed to load Google Analytics data.",
    };
  }
}
