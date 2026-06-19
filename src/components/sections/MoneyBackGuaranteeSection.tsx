import Link from "next/link";
import { BrandName } from "@/components/brand/BrandName";
import { FadeIn } from "@/components/ui/FadeIn";

export function MoneyBackGuaranteeSection() {
  return (
    <section className="border-y border-graphite bg-near-black">
      <FadeIn>
        <div className="mx-auto max-w-3xl px-6 py-12 text-center lg:px-8 lg:py-14">
          <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-full border border-graphite text-steel-silver">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path
                d="M10 2.5 4 5v5c0 3.5 2.6 6.8 6 7.5 3.4-.7 6-4 6-7.5V5l-6-2.5Z"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinejoin="round"
              />
              <path
                d="M7.5 10.2 9.3 12 12.5 8.5"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <p className="text-xs tracking-[0.18em] uppercase text-text-muted">
            Risk-free
          </p>
          <h2 className="mt-3 text-2xl font-light tracking-tight text-text-primary sm:text-3xl">
            30-day money-back guarantee
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
            Try <BrandName className="text-text-primary" /> with confidence. If your first order
            is not the right fit, contact us within 30 days of delivery for a straightforward
            refund on eligible products.
          </p>
          <Link
            href="/return-policy"
            className="mt-6 inline-block text-xs tracking-[0.14em] uppercase text-text-muted transition-colors hover:text-text-primary"
          >
            View return policy
          </Link>
        </div>
      </FadeIn>
    </section>
  );
}
