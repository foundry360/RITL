import { ButtonLink } from "@/components/ui/Button";
import { BrandName } from "@/components/brand/BrandName";
import { BRAND_NAME_PRONUNCIATION } from "@/lib/brand";

export function Hero() {
  return (
    <section className="relative min-h-[72vh] flex items-center justify-center overflow-hidden bg-near-black">
      <div
        className="absolute inset-0 bg-gradient-to-b from-near-black via-soft-black to-near-black"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, #C7CBD3 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-10 text-center lg:px-8 lg:pt-24 lg:pb-12">
        <p className="animate-fade-up text-xs tracking-[0.25em] uppercase text-text-muted mb-8">
          Cognitive Wellness
        </p>
        <h1 className="animate-fade-up animate-delay-100 mx-auto max-w-5xl text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light tracking-tight text-text-primary leading-[1.05]">
          Focus. Clarity. Performance.
        </h1>
        <p className="animate-fade-up animate-delay-200 mx-auto mt-8 max-w-3xl text-base sm:text-lg font-light leading-relaxed text-text-secondary lg:max-w-4xl">
          <BrandName /> ({BRAND_NAME_PRONUNCIATION}) Coffee is a functional ritual for those who optimize every moment.
          <br />
          Built for clean, sustained energy and uninterrupted focus without crashes, noise, or compromise.
        </p>
        <div className="animate-fade-up animate-delay-300 mt-12">
          <ButtonLink href="/#products" size="lg">
            Shop Now
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
