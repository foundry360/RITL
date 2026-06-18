import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrdersPanel } from "@/components/admin/OrdersPanel";
import {
  DEFAULT_ADMIN_ORDER_PAGE_SIZE,
  listAdminOrders,
} from "@/lib/admin/orders";
import { requireAdminSession } from "@/lib/admin/require-session";

export const metadata = {
  title: "Orders | RITL Admin",
};

export default async function AdminOrdersPage() {
  const user = await requireAdminSession();
  if (!user) {
    redirect("/admin/login");
  }

  const initialResult = await listAdminOrders({
    page: 1,
    pageSize: DEFAULT_ADMIN_ORDER_PAGE_SIZE,
  });

  return (
    <AdminShell userEmail={user.email}>
      <OrdersPanel initialResult={initialResult} />
    </AdminShell>
  );
}
