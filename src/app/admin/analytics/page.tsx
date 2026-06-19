import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { WebsiteAnalyticsPanel } from "@/components/admin/WebsiteAnalyticsPanel";
import { requireAdminSession } from "@/lib/admin/require-session";
import { getWebsiteAnalyticsData } from "@/lib/analytics/ga-data";
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

  return (
    <AdminShell userEmail={user.email}>
      <WebsiteAnalyticsPanel initialAnalytics={initialAnalytics} />
    </AdminShell>
  );
}
