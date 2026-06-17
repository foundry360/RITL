"use client";

import { Accordion } from "@/components/ui/Accordion";
import type {
  PreparationContent,
  Product,
  ProductDescriptionContent,
} from "@/lib/stripe/products";

interface ProductAccordionsProps {
  product: Product;
}

function renderProductDescription(
  description: string | ProductDescriptionContent | undefined
) {
  if (!description) {
    return null;
  }

  if (typeof description === "string") {
    return <p>{description}</p>;
  }

  return (
    <div className="space-y-4">
      {description.paragraphs?.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {description.listItems && description.listItems.length > 0 && (
        <ul className="space-y-2">
          {description.listItems.map((item) => (
            <li key={item} className="flex items-center gap-3">
              <span className="h-px w-4 shrink-0 bg-steel-silver/40" />
              {item}
            </li>
          ))}
        </ul>
      )}
      {description.closingParagraphs?.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}

function renderPreparation(
  preparation: string | PreparationContent | undefined
) {
  if (!preparation) {
    return null;
  }

  if (typeof preparation === "string") {
    return <p>{preparation}</p>;
  }

  return (
    <div className="space-y-6">
      {preparation.steps.map((step) => (
        <div key={step.title} className="space-y-3">
          <h4 className="font-semibold text-text-primary">{step.title}</h4>
          {step.listItems && step.listItems.length > 0 && (
            <ul className="space-y-2">
              {step.listItems.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="h-px w-4 shrink-0 bg-steel-silver/40" />
                  {item}
                </li>
              ))}
            </ul>
          )}
          {step.paragraphs?.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      ))}
    </div>
  );
}

export function ProductAccordions({ product }: ProductAccordionsProps) {
  const items = [
    {
      question: "Product Description",
      answer: renderProductDescription(product.productDescription),
    },
    {
      question: "Preparation",
      answer: renderPreparation(product.preparation),
    },
    {
      question: "Blend Composition",
      answer: renderProductDescription(product.blendComposition),
    },
  ];

  return <Accordion items={items} />;
}
