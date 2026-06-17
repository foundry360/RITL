import { FadeIn } from "@/components/ui/FadeIn";

const benefits = [
  {
    label: "Clean cognitive energy",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1" />
        <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "No crash",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M4 14l4-8 4 4 4-6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Focus enhancement",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1" />
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Functional ingredients",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <rect x="4" y="4" width="12" height="12" stroke="currentColor" strokeWidth="1" />
        <path d="M8 10h4M10 8v4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Daily performance ritual",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M6 4h8v12H6z" stroke="currentColor" strokeWidth="1" />
        <path d="M8 8h4M8 11h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function BenefitBanner() {
  return (
    <section className="border-y border-graphite bg-soft-black">
      <FadeIn>
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 lg:justify-between">
            {benefits.map((benefit) => (
              <div
                key={benefit.label}
                className="flex items-center gap-3 text-steel-silver"
              >
                <span className="opacity-60">{benefit.icon}</span>
                <span className="text-xs tracking-[0.12em] uppercase text-text-secondary whitespace-nowrap">
                  {benefit.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
