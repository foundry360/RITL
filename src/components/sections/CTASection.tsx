import { ButtonLink } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-soft-black py-24 lg:py-32">
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#1c1f26] via-soft-black to-soft-black"
        aria-hidden
      />

      <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-8">
        <FadeIn>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-text-primary leading-[1.1]">
            Elevate your
            <br />
            daily ritual.
          </h2>
          <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-text-secondary">
            Join those who refuse to compromise on focus, clarity, and
            performance. Your cognitive edge starts here.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <ButtonLink href="/#products" size="lg">
              Get Started
            </ButtonLink>
            <ButtonLink href="/#products" variant="outline" size="lg">
              Shop Functional Coffee
            </ButtonLink>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
