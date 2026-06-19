import type { ReactNode } from "react";
import { BrandName } from "@/components/brand/BrandName";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading, SectionLabel } from "@/components/ui/SectionLabel";

function withBrandName(text: string): ReactNode {
  if (!text.includes("RITÜL")) {
    return text;
  }

  const parts = text.split("RITÜL");
  return parts.flatMap((part, index) => {
    const nodes: ReactNode[] = [part];
    if (index < parts.length - 1) {
      nodes.push(<BrandName key={index} className="text-text-primary" />);
    }
    return nodes;
  });
}

const phases = [
  {
    range: "Days 1–30",
    title: "Discovery & Adjustment",
    subtitle: "This is your introduction phase.",
    bullets: [
      "You're finding your baseline response and ideal routine",
      "Effects may feel subtle or variable at first",
      "You're dialing in timing, dose, and daily context (morning, focus blocks, etc.)",
      "Early signals show whether it feels clean, jitter-free, and compatible with your lifestyle",
    ],
    goal: "Learn how RITÜL fits into your day.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 20 20" fill="none" aria-hidden>
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1" />
        <path
          d="M10 4.5v2M10 13.5v2M4.5 10h2M13.5 10h2"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <path
          d="M10 6.5 10.8 9.2 10 8.6 9.2 9.2Z"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    range: "Days 31–60",
    title: "Consistency & Pattern Recognition",
    subtitle: "This is where clarity starts to emerge.",
    bullets: [
      "Your body begins to respond more consistently",
      "Energy and focus feel more predictable day-to-day",
      "You've likely established a default routine that works",
      "You start to notice whether it supports productivity without crashes or overstimulation",
    ],
    goal: "Build a stable daily rhythm.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path
          d="M3 9.5c2-2 4-2 6 0s4 2 6 0"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <path
          d="M3 13c2-2 4-2 6 0s4 2 6 0"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <circle cx="4" cy="9.5" r="1" fill="currentColor" />
        <circle cx="10" cy="9.5" r="1" fill="currentColor" />
        <circle cx="16" cy="9.5" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    range: "Days 61–90",
    title: "Integration & Decision Point",
    subtitle: "This is the full experience phase.",
    bullets: [
      "RITÜL feels like part of your normal routine, not an experiment",
      "Benefits feel stable and repeatable when used consistently",
      "You can clearly evaluate whether it improves your focus, energy, and daily performance",
      "This is the point where most users decide if it's a long-term habit or occasional tool",
    ],
    goal: "Decide if RITÜL becomes part of your long-term routine.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 20 20" fill="none" aria-hidden>
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1" />
        <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1" />
        <path
          d="M8.2 10.2 9.4 11.4 12.2 8.6"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export function First90DaysSection() {
  return (
    <section className="relative overflow-hidden border-y border-graphite bg-near-black py-24 lg:py-32">
      <div
        className="absolute inset-0 bg-gradient-to-b from-soft-black via-[#12141a] to-near-black"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn>
          <div className="max-w-6xl">
            <SectionLabel>Your journey</SectionLabel>
            <SectionHeading className="mt-4">
              What to Expect in Your First 90 Days with <BrandName />
            </SectionHeading>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-text-secondary">
              <BrandName className="text-text-primary" /> is designed for consistency. The more
              regularly you use it, the more clearly you understand its fit in your daily
              performance system.
            </p>
          </div>
        </FadeIn>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {phases.map((phase, index) => (
            <FadeIn key={phase.range} delay={index * 100}>
              <div className="flex h-full flex-col rounded-[8px] border border-graphite p-8 transition-colors hover:border-graphite/80 hover:bg-soft-black/50">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-graphite text-steel-silver">
                  {phase.icon}
                </div>
                <p className="text-xs tracking-[0.18em] uppercase text-text-muted">
                  {phase.range}
                </p>
                <h3 className="mt-2 text-base font-semibold tracking-wide text-text-primary">
                  {phase.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">
                  {phase.subtitle}
                </p>
                <ul className="mt-5 flex-1 space-y-3 text-sm leading-relaxed text-text-secondary">
                  {phase.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span
                        className="mt-2 h-1 w-1 shrink-0 rounded-full bg-steel-silver"
                        aria-hidden
                      />
                      <span>{withBrandName(bullet)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 border-t border-graphite pt-5 text-sm text-text-primary">
                  <span className="font-medium">Goal:</span> {withBrandName(phase.goal)}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
