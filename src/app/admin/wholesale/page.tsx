import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { WholesalePanel } from "@/components/admin/WholesalePanel";
import {
  DEFAULT_ADMIN_WHOLESALE_PAGE_SIZE,
  listAdminWholesaleOrders,
} from "@/lib/admin/wholesale";
import { requireAdminSession } from "@/lib/admin/require-session";
import { BRAND_NAME } from "@/lib/brand";

export const metadata = {
  title: `Wholesale | ${BRAND_NAME} Admin`,
};

export default async function AdminWholesalePage() {
  const user = await requireAdminSession();
  if (!user) {
    redirect("/admin/login");
  }

  const initialResult = await listAdminWholesaleOrders({
    page: 1,
    pageSize: DEFAULT_ADMIN_WHOLESALE_PAGE_SIZE,
  });

  return (
    <AdminShell userEmail={user.email}>
      <WholesalePanel initialResult={initialResult} />
    </AdminShell>
  );
}
