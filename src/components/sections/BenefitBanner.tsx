import type { ReactNode } from "react";

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

const MARQUEE_COPIES = 4;

function BenefitItem({ label, icon }: { label: string; icon: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-3 px-8 text-steel-silver">
      <span className="opacity-60">{icon}</span>
      <span className="whitespace-nowrap text-xs tracking-[0.12em] uppercase text-text-secondary">
        {label}
      </span>
    </div>
  );
}

function BenefitGroup({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div
      className="benefit-marquee-group flex shrink-0 items-center"
      aria-hidden={ariaHidden || undefined}
    >
      {benefits.map((benefit) => (
        <BenefitItem key={benefit.label} label={benefit.label} icon={benefit.icon} />
      ))}
    </div>
  );
}

export function BenefitBanner() {
  return (
    <section className="border-y border-graphite bg-soft-black">
      <div className="relative overflow-hidden py-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-soft-black to-transparent sm:w-20"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-soft-black to-transparent sm:w-20"
        />

        <div
          className="benefit-marquee-track flex w-max will-change-transform"
          aria-hidden
        >
          {Array.from({ length: MARQUEE_COPIES }, (_, index) => (
            <BenefitGroup key={index} ariaHidden={index > 0} />
          ))}
        </div>

        <div
          className="benefit-marquee-fallback hidden flex-wrap items-center justify-center gap-x-12 gap-y-6 px-6"
          aria-label="Product benefits"
        >
          {benefits.map((benefit) => (
            <BenefitItem
              key={benefit.label}
              label={benefit.label}
              icon={benefit.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
