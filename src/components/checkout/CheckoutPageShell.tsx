import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { CheckoutTrustBar } from "@/components/checkout/CheckoutTrustBar";

type CheckoutStep = "cart" | "payment" | "confirmation";

interface CheckoutPageShellProps {
  step: CheckoutStep;
  backHref: string;
  backLabel: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function CheckoutPageShell({
  step,
  backHref,
  backLabel,
  title,
  description,
  children,
}: CheckoutPageShellProps) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-near-black pt-24 pb-16">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <Link
            href={backHref}
            className="text-xs tracking-[0.14em] uppercase text-text-muted transition-colors hover:text-text-primary"
          >
            ← {backLabel}
          </Link>

          <div className="mt-8 flex flex-col gap-6 border-b border-graphite pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-text-muted">
                Secure Checkout
              </p>
              <h1 className="mt-2 text-3xl font-light tracking-tight text-text-primary sm:text-4xl">
                {title}
              </h1>
              {description && (
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary">
                  {description}
                </p>
              )}
            </div>
            <CheckoutSteps current={step} />
          </div>

          <div className="mt-6">
            <CheckoutTrustBar />
          </div>

          <div className="mt-10">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}
