import { Suspense } from "react";
import { ClearCheckoutSession } from "@/components/checkout/ClearCheckoutSession";
import { SubmitOrderFulfillment } from "@/components/checkout/SubmitOrderFulfillment";
import { CheckoutPageShell } from "@/components/checkout/CheckoutPageShell";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = {
  title: "Order Confirmed | RITL Coffee",
};

export default function CheckoutSuccessPage() {
  return (
    <CheckoutPageShell
      step="confirmation"
      backHref="/"
      backLabel="Return home"
      title="Thank you."
      description="Your order has been received. A confirmation email will arrive shortly with tracking details once your ritual ships."
    >
      <ClearCheckoutSession />
      <Suspense fallback={null}>
        <SubmitOrderFulfillment />
      </Suspense>
      <div className="mx-auto max-w-lg rounded-[8px] border border-graphite bg-soft-black/40 p-10 text-center">
        <p className="text-sm leading-relaxed text-text-secondary">
          We are preparing your order for fulfillment. You will receive shipping
          updates as soon as your package is on its way.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/">Return Home</ButtonLink>
          <ButtonLink href="/#products" variant="outline">
            Continue Shopping
          </ButtonLink>
        </div>
      </div>
    </CheckoutPageShell>
  );
}
