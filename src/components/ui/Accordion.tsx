"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface AccordionItem {
  question: string;
  answer: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
}

export function Accordion({ items }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-graphite border-y border-graphite">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-6 py-6 text-left transition-colors hover:text-text-primary"
              aria-expanded={isOpen}
            >
              <span className="text-sm sm:text-base font-light text-text-primary tracking-wide">
                {item.question}
              </span>
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center text-steel-silver transition-transform duration-300",
                  isOpen && "rotate-45"
                )}
                aria-hidden
              >
                +
              </span>
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100 pb-6" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="text-sm leading-relaxed text-text-secondary max-w-2xl">
                  {item.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
