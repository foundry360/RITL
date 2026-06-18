import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmailPreviewPanel } from "@/components/admin/EmailPreviewPanel";
import { requireAdminSession } from "@/lib/admin/require-session";
import { BRAND_NAME } from "@/lib/brand";

export const metadata = {
  title: `Emails | ${BRAND_NAME} Admin`,
};

export default async function AdminEmailPreviewPage() {
  const user = await requireAdminSession();
  if (!user) {
    redirect("/admin/login");
  }

  return (
    <AdminShell userEmail={user.email}>
      <div className="space-y-6">
        <h1 className="font-serif text-3xl font-normal text-text-primary">
          Email templates
        </h1>
        <EmailPreviewPanel />
      </div>
    </AdminShell>
  );
}
