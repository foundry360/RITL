import { BrandName } from "@/components/brand/BrandName";
import { FadeIn } from "@/components/ui/FadeIn";
import { BRAND_NAME } from "@/lib/brand";

const regularCoffeePoints = [
  "Sharp energy spike followed by a hard crash",
  "Jittery focus, hard to sustain deep work",
  "Acidic, rough on an empty stomach",
  "Caffeine alone, no adaptogenic support",
  "Often needs a second or third cup",
];

const focusCoffeePoints = [
  "Smooth lift with no crash, hours of clarity",
  "Calm, grounded focus for deep work",
  "Low acidity, gentle on the stomach",
  "Lion's Mane and Chaga for cognitive support",
  "One cup, hot or cold, all day",
];

function SpikeChart() {
  return (
    <svg viewBox="0 0 280 88" className="h-24 w-full" aria-hidden>
      <defs>
        <linearGradient id="spike-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6e7480" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#6e7480" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 72 L28 22 L48 58 L72 18 L96 52 L118 28 L142 48 L164 24 L188 44 L212 30 L236 40 L280 36 L280 88 L0 88 Z"
        fill="url(#spike-fill)"
      />
      <path
        d="M0 72 L28 22 L48 58 L72 18 L96 52 L118 28 L142 48 L164 24 L188 44 L212 30 L236 40 L280 36"
        fill="none"
        stroke="#a7adb8"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlateauChart() {
  return (
    <svg viewBox="0 0 280 88" className="h-24 w-full" aria-hidden>
      <defs>
        <linearGradient id="plateau-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e85d24" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#e85d24" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 76 C36 76 52 42 88 34 C112 30 148 34 280 34 L280 88 L0 88 Z"
        fill="url(#plateau-fill)"
      />
      <path
        d="M0 76 C36 76 52 42 88 34 C112 30 148 34 280 34"
        fill="none"
        stroke="#e85d24"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CoffeeComparisonSection() {
  return (
    <section className="bg-elevated py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn>
          <div className="text-center">
            <p className="text-xs tracking-[0.22em] uppercase text-text-muted">
              <BrandName /> · Focus Coffee
            </p>
            <h2 className="mt-4 text-3xl font-light uppercase tracking-[0.06em] text-text-primary sm:text-4xl lg:text-5xl">
              The Crash. Or{" "}
              <span className="text-accent">The Steady Climb.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-text-secondary">
              Same goal — energy and focus. Two very different curves.
            </p>
          </div>
        </FadeIn>

        <div className="relative mt-16 grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div
            className="absolute left-1/2 top-8 hidden h-[calc(100%-4rem)] w-px -translate-x-1/2 border-l border-dashed border-graphite lg:block"
            aria-hidden
          />

          <FadeIn delay={100}>
            <div className="flex h-full flex-col rounded-[8px] border border-graphite bg-soft-black p-8">
              <p className="text-xs tracking-[0.18em] uppercase text-text-muted">
                Regular Coffee
              </p>
              <h3 className="mt-2 text-xl font-light text-text-primary">
                Caffeine Spike
              </h3>
              <div className="mt-6">
                <SpikeChart />
              </div>
              <p className="mt-3 text-sm text-text-secondary">
                Sharp spike, hard crash, repeat
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm leading-relaxed text-text-secondary">
                {regularCoffeePoints.map((point) => (
                  <li key={point} className="flex gap-3">
                    <span className="mt-0.5 shrink-0 text-text-muted" aria-hidden>
                      ✕
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>

          <FadeIn delay={200}>
            <div className="flex h-full flex-col rounded-[8px] border border-graphite bg-soft-black p-8">
              <p className="text-xs tracking-[0.18em] uppercase text-accent">
                Focus Coffee
              </p>
              <h3 className="mt-2 text-xl font-light text-accent">
                Sustained Clarity
              </h3>
              <div className="mt-6">
                <PlateauChart />
              </div>
              <p className="mt-3 text-sm text-accent/90">
                Smooth rise, long steady plateau
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm leading-relaxed text-text-secondary">
                {focusCoffeePoints.map((point) => (
                  <li key={point} className="flex gap-3">
                    <span className="mt-0.5 shrink-0 text-accent" aria-hidden>
                      ✓
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={300}>
          <p className="mx-auto mt-12 max-w-3xl text-center text-base leading-relaxed text-text-secondary">
            Same single-origin Papua New Guinea arabica.{" "}
            <span className="font-medium text-text-primary">
              {BRAND_NAME} Focus Coffee
            </span>{" "}
            adds functional mushrooms to turn a spike into a steady line.
          </p>
          <p className="mt-8 text-center text-xs tracking-[0.22em] uppercase text-text-muted">
            <BrandName />
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
