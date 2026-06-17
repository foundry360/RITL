import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface PolicyLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function PolicyLayout({ title, children }: PolicyLayoutProps) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-near-black pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <Link
            href="/"
            className="text-xs tracking-[0.14em] uppercase text-text-muted transition-colors hover:text-text-primary"
          >
            ← Home
          </Link>
          <h1 className="mt-8 text-3xl font-light tracking-tight text-text-primary">
            {title}
          </h1>
          <div className="mt-10 space-y-6 text-sm leading-relaxed text-text-secondary">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
