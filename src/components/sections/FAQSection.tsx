import { Accordion } from "@/components/ui/Accordion";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading, SectionLabel } from "@/components/ui/SectionLabel";
import { CONTACT_INBOX } from "@/lib/contact/config";

const faqItems = [
  {
    question: "What functional ingredients are included?",
    answer:
      "Both products are formulated for clean, sustained performance using carefully selected functional ingredients. Focus Coffee pairs a clean caffeine base with cognitive enhancers for clarity and execution. Matcha delivers ceremonial-grade green tea with smooth, steady energy. Full ingredient lists are available on each product page.",
  },
  {
    question: "What are the caffeine levels?",
    answer:
      "Focus Coffee contains approximately 120mg of caffeine per serving, comparable to a strong cup of coffee, but modulated by L-theanine for smoother delivery. Matcha provides roughly 70mg of caffeine with higher L-theanine content, creating a gentler, more sustained energy profile.",
  },
  {
    question: "How does shipping work?",
    answer:
      "We ship within 1–2 business days. Standard domestic delivery takes 3–5 business days. Express options are available at checkout. All orders are packaged in minimal, recyclable materials aligned with our design philosophy.",
  },
  {
    question: "Do you offer subscriptions?",
    answer:
      `Yes. Subscribe and save 15% with automatic delivery every 4 weeks. Pause, skip, or cancel anytime by contacting ${CONTACT_INBOX}.`,
  },
  {
    question: "When is the best time to consume?",
    answer:
      "For optimal results, consume within 30–60 minutes of waking or 30 minutes before focused work. Avoid consumption after 2pm if you are sensitive to caffeine. Matcha can be enjoyed later in the day due to its smoother energy profile.",
  },
];

export function FAQSection() {
  return (
    <section className="bg-elevated py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <FadeIn>
          <div className="text-center">
            <SectionLabel>Questions</SectionLabel>
            <SectionHeading className="mt-4">FAQ</SectionHeading>
          </div>
        </FadeIn>

        <FadeIn delay={150} className="mt-16">
          <Accordion items={faqItems} />
        </FadeIn>
      </div>
    </section>
  );
}
