import { Accordion } from "@/components/ui/Accordion";
import { PolicyLayout } from "@/components/layout/PolicyLayout";

export const metadata = {
  title: "FAQs | Functional Coffee",
};

const faqItems = [
  {
    question: "What functional ingredients are included?",
    answer:
      "Both products are formulated for clean, sustained performance using carefully selected functional ingredients. Focus Coffee pairs a clean caffeine base with cognitive enhancers for clarity and execution. Matcha delivers ceremonial-grade green tea with smooth, steady energy. Full ingredient lists are available on each product page.",
  },
  {
    question: "What are the caffeine levels?",
    answer:
      "Focus Coffee contains approximately 120mg of caffeine per serving. Matcha provides roughly 70mg of caffeine with higher L-theanine content for a gentler energy profile.",
  },
  {
    question: "How does shipping work?",
    answer:
      "We ship within 1–2 business days. Standard domestic delivery takes 3–5 business days. Express options are available at checkout.",
  },
  {
    question: "Do you offer subscriptions?",
    answer:
      "Yes. Subscribe and save 15% with automatic delivery every 4 weeks. Pause, skip, or cancel anytime by contacting support@getritl.com.",
  },
  {
    question: "When is the best time to consume?",
    answer:
      "Consume within 30–60 minutes of waking or 30 minutes before focused work. Avoid after 2pm if caffeine-sensitive. Matcha can be enjoyed later due to its smoother profile.",
  },
];

export default function FAQsPage() {
  return (
    <PolicyLayout title="Frequently Asked Questions">
      <Accordion items={faqItems} />
    </PolicyLayout>
  );
}
