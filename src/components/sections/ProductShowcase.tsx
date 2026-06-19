"use client";

import { ProductCard } from "@/components/product/ProductCard";
import { RitualCard } from "@/components/product/RitualCard";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading, SectionLabel } from "@/components/ui/SectionLabel";
import { products } from "@/lib/stripe/products";

export function ProductShowcase() {
  const focusCoffee = products["focus-coffee"];
  const matcha = products.matcha;

  return (
    <section id="products" className="bg-soft-black py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn>
          <div className="max-w-xl">
            <SectionLabel>The Collection</SectionLabel>
            <SectionHeading className="mt-4">
              Two rituals.
              <br />
              One standard.
            </SectionHeading>
            <p className="mt-6 text-base leading-relaxed text-text-secondary">
              Precision-formulated for distinct cognitive states. Subtle in
              differentiation, uncompromising in quality.
            </p>
          </div>
        </FadeIn>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <FadeIn delay={0}>
            <RitualCard />
          </FadeIn>
          <FadeIn delay={150}>
            <ProductCard product={matcha} />
          </FadeIn>
          <FadeIn delay={300}>
            <ProductCard product={focusCoffee} />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
