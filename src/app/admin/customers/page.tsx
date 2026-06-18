import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { CustomersPanel } from "@/components/admin/CustomersPanel";
import {
  DEFAULT_ADMIN_CUSTOMER_PAGE_SIZE,
  listAdminCustomers,
} from "@/lib/admin/customers";
import { requireAdminSession } from "@/lib/admin/require-session";

export const metadata = {
  title: "Customers | RITL Admin",
};

export default async function AdminCustomersPage() {
  const user = await requireAdminSession();
  if (!user) {
    redirect("/admin/login");
  }

  const initialResult = await listAdminCustomers({
    page: 1,
    pageSize: DEFAULT_ADMIN_CUSTOMER_PAGE_SIZE,
  });

  return (
    <AdminShell userEmail={user.email}>
      <CustomersPanel initialResult={initialResult} />
    </AdminShell>
  );
}
