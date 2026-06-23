import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { WebsiteAnalyticsPanel } from "@/components/admin/WebsiteAnalyticsPanel";
import { requireAdminSession } from "@/lib/admin/require-session";
import { getWebsiteAnalyticsData } from "@/lib/analytics/ga-data";
import { getGoogleAnalyticsConsoleUrl } from "@/lib/analytics/ga-credentials";
import { BRAND_NAME } from "@/lib/brand";

export const metadata = {
  title: `Analytics | ${BRAND_NAME} Admin`,
};

export default async function AdminAnalyticsPage() {
  const user = await requireAdminSession();
  if (!user) {
    redirect("/admin/login");
  }

  const initialAnalytics = await getWebsiteAnalyticsData();
  const googleAnalyticsUrl = getGoogleAnalyticsConsoleUrl();

  return (
    <AdminShell userEmail={user.email}>
      <WebsiteAnalyticsPanel
        initialAnalytics={initialAnalytics}
        googleAnalyticsUrl={googleAnalyticsUrl}
      />
    </AdminShell>
  );
}
