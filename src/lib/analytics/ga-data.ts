import { BetaAnalyticsDataClient } from "@google-analytics/data";
import {
  getGoogleAnalyticsPropertyId,
  getGoogleServiceAccountCredentials,
  isGoogleAnalyticsDataConfigured,
} from "@/lib/analytics/ga-credentials";

const ANALYTICS_DATE_RANGE = {
  startDate: "28daysAgo",
  endDate: "today",
  label: "Last 28 days",
} as const;

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
  pageTitle: string;
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

export interface WebsiteAnalyticsRealtime {
  activeUsersLast30Minutes: number;
  activeUsersLast5Minutes: number;
}

export interface WebsiteAnalyticsPageTitleRow {
  pageTitle: string;
  screenName: string;
  pageViews: number;
}

export interface WebsiteAnalyticsData {
  generatedAt: string;
  dateRangeLabel: string;
  configured: boolean;
  realtime: WebsiteAnalyticsRealtime;
  overview: WebsiteAnalyticsOverview;
  dailyTrend: WebsiteAnalyticsDailyPoint[];
  topPages: WebsiteAnalyticsPageRow[];
  pageTitles: WebsiteAnalyticsPageTitleRow[];
  devices: WebsiteAnalyticsDeviceRow[];
  channels: WebsiteAnalyticsChannelRow[];
  setupMessage?: string;
}

function createEmptyRealtime(): WebsiteAnalyticsRealtime {
  return {
    activeUsersLast30Minutes: 0,
    activeUsersLast5Minutes: 0,
  };
}

function createEmptyOverview(): WebsiteAnalyticsOverview {
  return {
    users: 0,
    sessions: 0,
    pageViews: 0,
    avgSessionDurationSeconds: 0,
  };
}

function createEmptyAnalyticsData(): WebsiteAnalyticsData {
  return {
    generatedAt: new Date().toISOString(),
    dateRangeLabel: ANALYTICS_DATE_RANGE.label,
    configured: false,
    realtime: createEmptyRealtime(),
    overview: createEmptyOverview(),
    dailyTrend: [],
    topPages: [],
    pageTitles: [],
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
        startDate: ANALYTICS_DATE_RANGE.startDate,
        endDate: ANALYTICS_DATE_RANGE.endDate,
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

async function runGaRealtimeReport(options: {
  dimensions?: string[];
  metrics: string[];
  orderBys?: Array<{ metric: string; desc?: boolean }>;
  limit?: number;
}) {
  const propertyId = getGoogleAnalyticsPropertyId();
  if (!propertyId) {
    throw new Error("GOOGLE_ANALYTICS_PROPERTY_ID is not configured.");
  }

  const client = createAnalyticsClient();

  const [response] = await client.runRealtimeReport({
    property: `properties/${propertyId}`,
    dimensions: options.dimensions?.map((name) => ({ name })),
    metrics: options.metrics.map((name) => ({ name })),
    orderBys: options.orderBys?.map((entry) => ({
      metric: { metricName: entry.metric },
      desc: entry.desc ?? true,
    })),
    limit: options.limit,
  });

  return response;
}

function parseMinutesAgo(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function getActiveUsersLast5Minutes(
  rows: Array<{
    dimensionValues?: Array<{ value?: string | null }> | null;
    metricValues?: Array<{ value?: string | null }> | null;
  }> | null | undefined
): number {
  return (rows ?? []).reduce((total, row) => {
    const minutesAgo = parseMinutesAgo(row.dimensionValues?.[0]?.value);
    if (minutesAgo === null || minutesAgo >= 5) {
      return total;
    }

    return total + parseMetricValue(row.metricValues?.[0]?.value);
  }, 0);
}

export async function getWebsiteAnalyticsData(): Promise<WebsiteAnalyticsData> {
  if (!isGoogleAnalyticsDataConfigured()) {
    return createEmptyAnalyticsData();
  }

  try {
    const [
      realtimeOverviewReport,
      realtimeMinutesReport,
      overviewReport,
      dailyReport,
      pageTitlesReport,
      devicesReport,
      channelsReport,
    ] = await Promise.all([
        runGaRealtimeReport({
          metrics: ["activeUsers"],
        }),
        runGaRealtimeReport({
          dimensions: ["minutesAgo"],
          metrics: ["activeUsers"],
        }),
        runGaReport({
          dimensions: [],
          metrics: [
            "activeUsers",
            "sessions",
            "screenPageViews",
            "averageSessionDuration",
          ],
        }),
        runGaReport({
          dimensions: ["date"],
          metrics: ["activeUsers", "sessions", "screenPageViews"],
          orderBys: [{ dimension: "date" }],
        }),
        runGaReport({
          dimensions: ["pageTitle", "unifiedScreenName"],
          metrics: ["screenPageViews", "activeUsers"],
          orderBys: [{ metric: "screenPageViews", desc: true }],
          limit: 25,
        }),
        runGaReport({
          dimensions: ["deviceCategory"],
          metrics: ["sessions"],
          orderBys: [{ metric: "sessions", desc: true }],
          limit: 5,
        }),
        runGaReport({
          dimensions: ["sessionDefaultChannelGroup"],
          metrics: ["sessions"],
          orderBys: [{ metric: "sessions", desc: true }],
          limit: 6,
        }),
      ]);

    const realtime: WebsiteAnalyticsRealtime = {
      activeUsersLast30Minutes: parseMetricValue(
        realtimeOverviewReport.rows?.[0]?.metricValues?.[0]?.value
      ),
      activeUsersLast5Minutes: getActiveUsersLast5Minutes(realtimeMinutesReport.rows),
    };

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

    const pageTitles: WebsiteAnalyticsPageTitleRow[] =
      pageTitlesReport.rows?.map((row) => {
        const metrics = row.metricValues ?? [];

        return {
          pageTitle: row.dimensionValues?.[0]?.value?.trim() || "—",
          screenName: row.dimensionValues?.[1]?.value?.trim() || "—",
          pageViews: parseMetricValue(metrics[0]?.value),
        };
      }) ?? [];

    const topPages: WebsiteAnalyticsPageRow[] = pageTitlesReport.rows
      ?.slice(0, 8)
      .map((row) => {
        const metrics = row.metricValues ?? [];

        return {
          pageTitle: row.dimensionValues?.[0]?.value?.trim() || "—",
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
      dateRangeLabel: ANALYTICS_DATE_RANGE.label,
      configured: true,
      realtime,
      overview,
      dailyTrend,
      topPages,
      pageTitles,
      devices,
      channels,
    };
  } catch (error) {
    console.error("Google Analytics data fetch failed:", error);

    return {
      ...createEmptyAnalyticsData(),
      setupMessage:
        error instanceof Error
          ? error.message
          : "Failed to load Google Analytics data.",
    };
  }
}
