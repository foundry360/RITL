import { ButtonLink } from "@/components/ui/Button";
import { BrandName } from "@/components/brand/BrandName";
import { BRAND_NAME_PRONUNCIATION } from "@/lib/brand";

export function Hero() {
  return (
    <section className="relative flex min-h-[72vh] items-center overflow-hidden bg-black">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, #C7CBD3 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-20 pb-10 text-left lg:px-8 lg:pt-24 lg:pb-12">
        <p className="animate-fade-up text-xs tracking-[0.25em] uppercase text-text-muted mb-8">
          Cognitive Wellness
        </p>
        <h1 className="animate-fade-up animate-delay-100 max-w-5xl text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light tracking-tight text-text-primary leading-[1.05]">
          Focus. Clarity. Performance.
        </h1>
        <p className="animate-fade-up animate-delay-200 mt-8 max-w-3xl text-base sm:text-lg font-light leading-relaxed text-text-secondary lg:max-w-4xl">
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
