import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { CoffeeComparisonSection } from "@/components/sections/CoffeeComparisonSection";
import { StorySection } from "@/components/sections/StorySection";
import { BenefitBanner } from "@/components/sections/BenefitBanner";
import { ProductShowcase } from "@/components/sections/ProductShowcase";
import { EditorialSplit } from "@/components/sections/EditorialSplit";
import { BenefitsRITL } from "@/components/sections/BenefitsRITL";
import { First90DaysSection } from "@/components/sections/First90DaysSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { MoneyBackGuaranteeSection } from "@/components/sections/MoneyBackGuaranteeSection";
import { CTASection } from "@/components/sections/CTASection";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <CoffeeComparisonSection />
        <StorySection />
        <BenefitBanner />
        <EditorialSplit />
        <BenefitsRITL />
        <First90DaysSection />
        <ProductShowcase />
        <FAQSection />
        <MoneyBackGuaranteeSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
