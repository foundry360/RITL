import { CheckoutPageShell } from "@/components/checkout/CheckoutPageShell";
import { CartCheckoutContent } from "@/components/checkout/CartCheckoutContent";
import { BRAND_COFFEE, BRAND_NAME } from "@/lib/brand";

export const metadata = {
  title: `Secure Checkout | ${BRAND_COFFEE}`,
};

export default function CheckoutPage() {
  return (
    <CheckoutPageShell
      step="payment"
      backHref="/cart"
      backLabel="Back to cart"
      title="Complete your order"
      description={`Review your ${BRAND_NAME} order and enter payment details. Your information is encrypted and processed securely by Stripe.`}
    >
      <CartCheckoutContent />
    </CheckoutPageShell>
  );
}
