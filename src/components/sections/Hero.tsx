import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { BrandName } from "@/components/brand/BrandName";
import { BRAND_NAME_PRONUNCIATION } from "@/lib/brand";

export function Hero() {
  return (
    <section className="relative flex min-h-[72vh] items-center overflow-hidden bg-black">
      <div
        className="absolute inset-y-0 left-0 w-full opacity-[0.04] lg:w-1/2"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, #C7CBD3 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
        <div className="text-left">
          <p className="animate-fade-up text-xs tracking-[0.25em] uppercase text-text-muted">
            Cognitive Wellness
          </p>
          <h1 className="animate-fade-up animate-delay-100 mt-6 max-w-xl text-2xl font-light tracking-tight text-text-primary leading-[1.05] sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
            Focus. Clarity. Performance.
          </h1>
          <p className="animate-fade-up animate-delay-200 mt-8 max-w-xl text-base font-light leading-relaxed text-text-secondary sm:text-lg">
            <BrandName /> ({BRAND_NAME_PRONUNCIATION}) Coffee is a functional ritual for those
            who optimize every moment. Built for clean, sustained energy and uninterrupted focus
            without crashes, noise, or compromise.
          </p>
          <div className="animate-fade-up animate-delay-300 mt-10">
            <ButtonLink href="/#products" size="lg">
              Shop Now
            </ButtonLink>
          </div>
        </div>

        <div className="animate-fade-up animate-delay-200 flex items-center justify-center lg:justify-end">
          <Image
            src="/hero-brand-cup.png"
            alt="RITÜL logo on a black coffee mug with steam rising"
            width={799}
            height={1024}
            className="h-auto max-h-[min(72vh,680px)] w-auto max-w-full object-contain lg:max-w-none"
            priority
          />
        </div>
      </div>
    </section>
  );
}
