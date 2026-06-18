import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | RITL",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-near-black text-text-primary">{children}</div>
  );
}
