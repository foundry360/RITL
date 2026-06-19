import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { DashboardPanel } from "@/components/admin/DashboardPanel";
import { requireAdminSession } from "@/lib/admin/require-session";
import {
  DEFAULT_DASHBOARD_TIME_RANGE,
  getAdminDashboardStats,
  normalizeDashboardDays,
} from "@/lib/admin/stats";
import { BRAND_NAME } from "@/lib/brand";

export const metadata = {
  title: `Dashboard | ${BRAND_NAME} Admin`,
};

export default async function AdminDashboardPage({
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
  const initialStats = await getAdminDashboardStats(days);

  return (
    <AdminShell userEmail={user.email}>
      <DashboardPanel initialStats={initialStats} />
    </AdminShell>
  );
}
