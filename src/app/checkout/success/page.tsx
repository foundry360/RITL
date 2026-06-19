import { ClearCheckoutSession } from "@/components/checkout/ClearCheckoutSession";
import { CheckoutPageShell } from "@/components/checkout/CheckoutPageShell";
import { ButtonLink } from "@/components/ui/Button";
import { BRAND_COFFEE } from "@/lib/brand";
import { processSuccessfulPaymentIntent } from "@/lib/fulfillment/process-payment-intent";

export const metadata = {
  title: `Order Confirmed | ${BRAND_COFFEE}`,
};

interface CheckoutSuccessPageProps {
  searchParams: Promise<{ payment_intent?: string }>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const params = await searchParams;
  const paymentIntentId = params.payment_intent?.trim();

  if (paymentIntentId?.startsWith("pi_")) {
    try {
      await processSuccessfulPaymentIntent(paymentIntentId);
    } catch (error) {
      console.error("Checkout success fulfillment failed:", error);
    }
  }

  return (
    <CheckoutPageShell
      step="confirmation"
      backHref="/"
      backLabel="Return home"
      title="Thank you."
      description="Your order has been received. A confirmation email will arrive shortly with tracking details once your ritual ships."
    >
      <ClearCheckoutSession />
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
