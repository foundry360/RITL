import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { WholesaleDetailPanel } from "@/components/admin/WholesaleDetailPanel";
import { getAdminWholesaleOrder } from "@/lib/admin/wholesale";
import { requireAdminSession } from "@/lib/admin/require-session";
import { BRAND_NAME } from "@/lib/brand";

interface AdminWholesaleDetailPageProps {
  params: Promise<{ orderId: string }>;
}

export async function generateMetadata({ params }: AdminWholesaleDetailPageProps) {
  const { orderId } = await params;
  const order = await getAdminWholesaleOrder(orderId);

  return {
    title: order
      ? `${order.itemsSummary} | ${BRAND_NAME} Wholesale`
      : `Wholesale Order | ${BRAND_NAME} Admin`,
  };
}

export default async function AdminWholesaleDetailPage({
  params,
}: AdminWholesaleDetailPageProps) {
  const user = await requireAdminSession();
  if (!user) {
    redirect("/admin/login");
  }

  const { orderId } = await params;
  const order = await getAdminWholesaleOrder(orderId);

  if (!order) {
    notFound();
  }

  return (
    <AdminShell userEmail={user.email}>
      <WholesaleDetailPanel order={order} />
    </AdminShell>
  );
}
