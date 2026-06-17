import { CheckoutPageShell } from "@/components/checkout/CheckoutPageShell";
import { CartCheckoutContent } from "@/components/checkout/CartCheckoutContent";

export const metadata = {
  title: "Secure Checkout | RITL Coffee",
};

export default function CheckoutPage() {
  return (
    <CheckoutPageShell
      step="payment"
      backHref="/cart"
      backLabel="Back to cart"
      title="Complete your order"
      description="Review your RITL order and enter payment details. Your information is encrypted and processed securely by Stripe."
    >
      <CartCheckoutContent />
    </CheckoutPageShell>
  );
}
