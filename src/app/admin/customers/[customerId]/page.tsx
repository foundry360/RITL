import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { CustomerDetailPanel } from "@/components/admin/CustomerDetailPanel";
import { getAdminCustomer } from "@/lib/admin/customers";
import { requireAdminSession } from "@/lib/admin/require-session";
import { BRAND_NAME } from "@/lib/brand";

interface AdminCustomerDetailPageProps {
  params: Promise<{ customerId: string }>;
}

export async function generateMetadata({ params }: AdminCustomerDetailPageProps) {
  const { customerId } = await params;
  const customer = await getAdminCustomer(customerId);

  return {
    title: customer
      ? `${customer.name} | ${BRAND_NAME} Admin`
      : `Customer | ${BRAND_NAME} Admin`,
  };
}

export default async function AdminCustomerDetailPage({
  params,
}: AdminCustomerDetailPageProps) {
  const user = await requireAdminSession();
  if (!user) {
    redirect("/admin/login");
  }

  const { customerId } = await params;
  const customer = await getAdminCustomer(customerId);

  if (!customer) {
    notFound();
  }

  return (
    <AdminShell userEmail={user.email}>
      <CustomerDetailPanel customer={customer} />
    </AdminShell>
  );
}
