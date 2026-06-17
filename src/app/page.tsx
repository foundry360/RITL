import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { StorySection } from "@/components/sections/StorySection";
import { BenefitBanner } from "@/components/sections/BenefitBanner";
import { ProductShowcase } from "@/components/sections/ProductShowcase";
import { EditorialSplit } from "@/components/sections/EditorialSplit";
import { BenefitsRITL } from "@/components/sections/BenefitsRITL";
import { FAQSection } from "@/components/sections/FAQSection";
import { CTASection } from "@/components/sections/CTASection";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <StorySection />
        <BenefitBanner />
        <ProductShowcase />
        <EditorialSplit />
        <BenefitsRITL />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
