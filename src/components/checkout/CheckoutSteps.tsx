import { cn } from "@/lib/utils";

type CheckoutStep = "cart" | "payment" | "confirmation";

const steps: { id: CheckoutStep; label: string }[] = [
  { id: "cart", label: "Cart" },
  { id: "payment", label: "Payment" },
  { id: "confirmation", label: "Confirmation" },
];

interface CheckoutStepsProps {
  current: CheckoutStep;
}

export function CheckoutSteps({ current }: CheckoutStepsProps) {
  const currentIndex = steps.findIndex((step) => step.id === current);

  return (
    <nav aria-label="Checkout progress" className="flex items-center gap-3">
      {steps.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = step.id === current;

        return (
          <div key={step.id} className="flex items-center gap-3">
            {index > 0 && (
              <span
                className={cn(
                  "h-px w-8 sm:w-12",
                  isComplete ? "bg-steel-silver/50" : "bg-graphite"
                )}
                aria-hidden
              />
            )}
            <span
              className={cn(
                "text-[10px] tracking-[0.16em] uppercase",
                isCurrent
                  ? "text-text-primary"
                  : isComplete
                    ? "text-steel-silver"
                    : "text-text-muted"
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}
