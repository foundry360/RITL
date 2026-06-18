import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = {
  title: "Admin Sign In | RITL",
};

export default function AdminLoginPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16 text-center">
        <h1 className="text-2xl font-light tracking-tight text-text-primary">
          Admin unavailable
        </h1>
        <p className="mt-4 text-sm text-text-secondary">
          Supabase is not configured. Add{" "}
          <code className="text-text-primary">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-text-primary">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
          to your environment.
        </p>
      </div>
    );
  }

  return <AdminLoginForm />;
}
