import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrderDetailPanel } from "@/components/admin/OrderDetailPanel";
import { getAdminOrder } from "@/lib/admin/orders";
import { requireAdminSession } from "@/lib/admin/require-session";

interface AdminOrderDetailPageProps {
  params: Promise<{ orderId: string }>;
}

export async function generateMetadata({ params }: AdminOrderDetailPageProps) {
  const { orderId } = await params;
  const order = await getAdminOrder(orderId);

  return {
    title: order ? `${order.itemsSummary} | RITL Admin` : "Order | RITL Admin",
  };
}

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const user = await requireAdminSession();
  if (!user) {
    redirect("/admin/login");
  }

  const { orderId } = await params;
  const order = await getAdminOrder(orderId);

  if (!order) {
    notFound();
  }

  return (
    <AdminShell userEmail={user.email}>
      <OrderDetailPanel order={order} />
    </AdminShell>
  );
}
