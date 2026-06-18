import Image from "next/image";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading, SectionLabel } from "@/components/ui/SectionLabel";
import { BrandName } from "@/components/brand/BrandName";
import { BRAND_COFFEE, BRAND_NAME_PRONUNCIATION } from "@/lib/brand";
import { cn } from "@/lib/utils";

const audienceItems = [
  "The founders moving between decisions that shape outcomes.",
  "The professionals who measure their day in output, not hours.",
  "The creators who need flow state more than stimulation.",
  "The people who don't just want energy. They want control over it.",
];

function StoryImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative h-[530px] overflow-hidden rounded-[8px] border border-graphite bg-elevated",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover object-center"
        sizes="(max-width: 1024px) 100vw, 50vw"
      />
    </div>
  );
}

export function StorySection() {
  return (
    <section className="bg-soft-black py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
          <div className="space-y-6">
            <FadeIn>
              <SectionLabel>The Story</SectionLabel>
              <SectionHeading className="mt-4">
                The Story Behind <BrandName />
              </SectionHeading>
            </FadeIn>
            <FadeIn delay={100}>
              <p className="text-base leading-relaxed text-text-secondary">
                <BrandName /> ({BRAND_NAME_PRONUNCIATION}) Coffee was created from a simple belief: energy
                should be intentional, not accidental.
              </p>
            </FadeIn>
            <FadeIn delay={150}>
              <p className="text-base leading-relaxed text-text-secondary">
                Most coffee is consumed out of habit: rushed mornings, scattered
                focus, and unpredictable crashes that break the rhythm of the
                day. <BrandName /> was designed to change that. It reframes coffee as a
                ritual, not a reaction.
              </p>
            </FadeIn>
            <FadeIn delay={200}>
              <p className="text-base leading-relaxed text-text-secondary">
                A ritual is something you choose. It&apos;s deliberate. It sets
                the tone for how you show up.
              </p>
            </FadeIn>
            <FadeIn delay={250}>
              <p className="text-base font-light text-text-primary">
                <BrandName /> is built for that moment.
              </p>
            </FadeIn>
            <FadeIn delay={300}>
              <p className="text-base leading-relaxed text-text-secondary">
                Every cup is designed to support clean, sustained energy and
                uninterrupted focus that carries you through deep work,
                demanding schedules, and high-performance days without the
                spikes and drops that disrupt momentum.
              </p>
            </FadeIn>
          </div>

          <FadeIn delay={150}>
            <StoryImage
              src="/story-mushrooms-v4.png"
              alt={`${BRAND_COFFEE} with functional mushrooms and ingredients`}
            />
          </FadeIn>
        </div>

        <div className="mt-20 grid gap-12 lg:mt-24 lg:grid-cols-2 lg:gap-16 lg:items-center">
          <FadeIn delay={100} className="order-2 lg:order-1">
            <StoryImage
              src="/story-audience-v5.png"
              alt="Coffee and conversation at a cafe table"
            />
          </FadeIn>

          <div className="order-1 lg:order-2">
            <FadeIn delay={100}>
              <h3 className="text-2xl sm:text-3xl font-light tracking-tight text-text-primary">
                Who <BrandName /> Is For
              </h3>
            </FadeIn>

            <FadeIn delay={150}>
              <p className="mt-6 text-base leading-relaxed text-text-secondary">
                <BrandName /> is for the builders, the thinkers, and the operators.
              </p>
            </FadeIn>

            <ul className="mt-10 space-y-6">
              {audienceItems.map((item, index) => (
                <FadeIn key={item} delay={200 + index * 75}>
                  <li className="border-l border-graphite pl-6">
                    <p className="text-base leading-relaxed text-text-secondary">
                      {item}
                    </p>
                  </li>
                </FadeIn>
              ))}
            </ul>

            <div className="mt-12 space-y-6">
              <FadeIn delay={500}>
                <p className="text-base leading-relaxed text-text-secondary">
                  <BrandName /> is not for noise. It&apos;s for clarity. Not for chasing
                  energy, but for sustaining it.
                </p>
              </FadeIn>
              <FadeIn delay={550}>
                <p className="text-base leading-relaxed text-text-secondary">
                  It&apos;s coffee designed to fit the way high-performance lives
                  actually work: focused, intentional, and consistent.
                </p>
              </FadeIn>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
