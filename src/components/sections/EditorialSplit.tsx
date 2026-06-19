import Image from "next/image";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading, SectionLabel } from "@/components/ui/SectionLabel";

const blocks = [
  {
    title: "The Ritual",
    body: "Every morning is an opportunity to set the tone for your day. Functional Coffee transforms your daily brew into a deliberate act of cognitive optimization, a moment of clarity before the world demands your attention.",
  },
  {
    title: "The Science",
    body: "Our formulations are designed to deliver clean, controlled energy that supports sustained focus and clarity. The result is smooth, consistent alertness without the sharp spikes or abrupt crashes of conventional coffee.",
  },
  {
    title: "The Standard",
    body: "We source with the same rigor applied to the world's finest instruments. Single-origin bases, ceremonial-grade matcha, and functional compounds. Each ingredient selected for purity, potency, and purpose.",
  },
];

export function EditorialSplit() {
  return (
    <section className="bg-soft-black py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div>
            <FadeIn delay={100}>
              <SectionLabel>A Different Standard</SectionLabel>
              <SectionHeading className="mt-4">
                Designed for
                <br />
                deliberate living.
              </SectionHeading>
            </FadeIn>

            <div className="mt-12 space-y-10">
              {blocks.map((block, index) => (
                <FadeIn key={block.title} delay={200 + index * 100}>
                  <div className="border-l border-graphite pl-6">
                    <h3 className="text-sm tracking-[0.14em] uppercase text-steel-silver">
                      {block.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                      {block.body}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>

          <FadeIn className="lg:-my-8">
            <div className="overflow-hidden rounded-[8px] border border-graphite bg-elevated lg:origin-center lg:scale-[0.92_1.1]">
              <Image
                src="/deliberate-living.png"
                alt="Iced matcha latte and matcha powder with steam rising on a wooden surface"
                width={733}
                height={708}
                className="h-auto w-full"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
