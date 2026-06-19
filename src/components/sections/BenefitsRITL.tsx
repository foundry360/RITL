import Image from "next/image";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading, SectionLabel } from "@/components/ui/SectionLabel";
import { BrandName } from "@/components/brand/BrandName";
import { BRAND_NAME_PRONUNCIATION } from "@/lib/brand";

const benefits = [
  {
    title: "Clean energy without crash",
    description:
      "Balanced caffeine delivers smooth, sustained alertness that builds gradually and fades naturally, without spikes or crashes.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path
          d="M11 2 7 10.5h3L9 18l6-8.5h-3l4-7.5H11V2z"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Mental clarity and focus",
    description:
      "Nootropic compounds support working memory and attention, helping you maintain sharp focus through demanding tasks.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path
          d="M10 4C6.5 4 4.5 6.8 4.5 10c0 2.2 1.2 4.5 3.2 5.5.8.4 1.6.5 2.3.5s1.5-.1 2.3-.5c2-1 3.2-3.3 3.2-5.5C15.5 6.8 13.5 4 10 4z"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path
          d="M10 5.5v8.5M7 8.5c.7.7 1.4 1 2.2.8M13 8.5c-.7.7-1.4 1-2.2.8M7.5 11.2c.6.5 1.1.6 1.7.6M12.5 11.2c-.6.5-1.1.6-1.7.6"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Functional ingredients for performance",
    description:
      "Every ingredient is selected for a specific cognitive function. No fillers, no proprietary blends hiding weak formulations.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden>
        <circle cx="10" cy="5.5" r="2" stroke="currentColor" strokeWidth="1" />
        <circle cx="5.5" cy="14" r="2" stroke="currentColor" strokeWidth="1" />
        <circle cx="14.5" cy="14" r="2" stroke="currentColor" strokeWidth="1" />
        <path
          d="M10 7.5 6.2 12M10 7.5l3.8 4.5M7.5 14h5"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Daily cognitive ritual optimization",
    description:
      "Transform your morning routine into a performance protocol. Consistency compounds. Ritual becomes results.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden>
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1" />
        <path
          d="M10 6v4l3 2"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export function BenefitsRITL() {
  return (
    <section id="benefits" className="bg-elevated py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn>
          <div className="max-w-3xl">
            <SectionLabel><BrandName /></SectionLabel>
            <SectionHeading className="mt-4">
              Benefits of <BrandName /> ({BRAND_NAME_PRONUNCIATION})
            </SectionHeading>
            <p className="mt-6 text-base leading-relaxed text-text-secondary">
              <BrandName className="text-text-primary" /> is for daily cognitive optimization through intentional, functional nutrition.
            </p>
          </div>
        </FadeIn>

        <div className="mt-16 grid gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-6">
          <FadeIn>
            <article className="group flex h-full flex-col overflow-hidden rounded-[8px] border border-graphite bg-near-black transition-colors hover:border-graphite/80 hover:bg-soft-black/60">
              <div className="flex flex-1 flex-col p-5 lg:p-6">
                <ul className="space-y-5">
                  {benefits.map((benefit) => (
                    <li key={benefit.title} className="flex gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-graphite/70 bg-transparent text-steel-silver transition-colors group-hover:border-steel-silver/30">
                        {benefit.icon}
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <h3 className="text-sm font-semibold tracking-wide text-text-primary">
                          {benefit.title}
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-text-secondary sm:text-sm">
                          {benefit.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </FadeIn>

          <FadeIn delay={150} className="h-full">
            <div className="relative h-full min-h-[280px] overflow-hidden rounded-[8px] border border-graphite">
              <Image
                src="/benefits-lifestyle.png"
                alt="Woman enjoying a warm cup of RITÜL coffee"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={200}>
          <p className="mt-12 max-w-3xl text-base leading-relaxed text-text-secondary">
            Ritual is where performance begins. It&apos;s not about quick energy or short-term
            boosts. It&apos;s about showing up the same way every day with clarity, control, and
            intention. <BrandName className="text-text-primary" /> is designed to make that
            consistency effortless, so better days become your baseline.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
