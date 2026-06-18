import { BrandName } from "@/components/brand/BrandName";
import { BRAND_NAME_PRONUNCIATION } from "@/lib/brand";

const ritualBenefits = [
  {
    title: "Morning intention",
    description:
      "Start the day with clarity, not noise. Set cognitive direction before distraction takes over.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path
          d="M10 4v2M10 14v2M4 10H2M18 10h-2M5.5 5.5l1.5 1.5M13 13l1.5 1.5M5.5 14.5 7 13M13 7l1.5-1.5"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1" />
      </svg>
    ),
  },
  {
    title: "Daily consistency",
    description:
      "Repeatable inputs create predictable output. Energy, focus, and performance become engineered, not improvised.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden>
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1" />
        <path
          d="M10 6v4l3 2"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Mindful preparation",
    description:
      "What you consume shapes how you think. Your ritual becomes a filter for clarity and execution.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path
          d="M6 14c0-2.2 1.8-4 4-4s4 1.8 4 4M10 6V4M8.5 4.5 10 3l1.5 1.5"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 16h10"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Performance tracking",
    description:
      "Awareness compounds improvement. Measure how you feel, focus, and perform over time.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path
          d="M4 15V8M8 15V5M12 15v-4M16 15V7"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <path
          d="M3 16h14"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export function RitualCard() {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[8px] border border-graphite bg-near-black transition-colors hover:border-graphite/80 hover:bg-soft-black/40">
      <div className="flex flex-1 flex-col p-5 lg:p-6">
        <div>
          <span className="inline-block text-[10px] tracking-[0.2em] uppercase text-steel-silver mb-2">
            Ritual & Routine
          </span>
          <h3 className="text-xl font-light tracking-tight text-text-primary">
            Build your <BrandName /> ({BRAND_NAME_PRONUNCIATION})
          </h3>
          <p className="mt-3 text-xs leading-relaxed text-text-secondary sm:text-sm">
            Cognitive performance is not a momentary decision. It is a structured
            daily system. Functional Coffee helps you design a repeatable ritual
            that compounds clarity, focus, and calm energy over time. Not
            motivation. Not hacks. A consistent operating rhythm for how you
            perform.
          </p>
        </div>

        <ul className="mt-6 space-y-5">
          {ritualBenefits.map((benefit) => (
            <li key={benefit.title} className="flex gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-graphite/70 bg-transparent text-steel-silver transition-colors group-hover:border-steel-silver/30">
                {benefit.icon}
              </div>
              <div className="min-w-0 pt-0.5">
                <h4 className="text-sm font-semibold tracking-wide text-text-primary">
                  {benefit.title}
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-text-secondary sm:text-sm">
                  {benefit.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
