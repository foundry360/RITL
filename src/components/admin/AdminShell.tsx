"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const adminTabs = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/wholesale", label: "Wholesale" },
  { href: "/admin/email-preview", label: "Emails" },
];

function isTabActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface AdminShellProps {
  children: React.ReactNode;
  userEmail?: string;
}

export function AdminShell({ children, userEmail }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-graphite bg-soft-black/40">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-6 px-6 py-5 lg:px-10">
          <div className="flex items-center gap-8">
            <Logo height={24} href="/admin/dashboard" />
            <nav className="flex items-center gap-2">
              {adminTabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "rounded-[8px] px-4 py-2 text-xs tracking-[0.14em] uppercase transition-colors",
                    isTabActive(pathname, tab.href)
                      ? "bg-graphite text-text-primary"
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {userEmail ? (
              <span className="hidden text-xs text-text-muted sm:inline">
                {userEmail}
              </span>
            ) : null}
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] px-6 py-10 lg:px-10">{children}</main>
    </div>
  );
}
