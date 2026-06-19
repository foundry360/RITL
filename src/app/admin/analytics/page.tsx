import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { WebsiteAnalyticsPanel } from "@/components/admin/WebsiteAnalyticsPanel";
import { requireAdminSession } from "@/lib/admin/require-session";
import {
  DEFAULT_DASHBOARD_TIME_RANGE,
  normalizeDashboardDays,
} from "@/lib/admin/stats";
import { getWebsiteAnalyticsData } from "@/lib/analytics/ga-data";
import { BRAND_NAME } from "@/lib/brand";

export const metadata = {
  title: `Analytics | ${BRAND_NAME} Admin`,
};

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const user = await requireAdminSession();
  if (!user) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const days = normalizeDashboardDays(
    Number(params.days ?? DEFAULT_DASHBOARD_TIME_RANGE)
  );
  const initialAnalytics = await getWebsiteAnalyticsData(days);

  return (
    <AdminShell userEmail={user.email}>
      <WebsiteAnalyticsPanel initialAnalytics={initialAnalytics} />
    </AdminShell>
  );
}
