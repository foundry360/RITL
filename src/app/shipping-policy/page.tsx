import { PolicyLayout } from "@/components/layout/PolicyLayout";

export const metadata = {
  title: "Shipping Policy | Functional Coffee",
};

export default function ShippingPolicyPage() {
  return (
    <PolicyLayout title="Shipping Policy">
      <p>
        Orders are processed with the same precision we apply to our
        formulations. Here is what to expect when you order.
      </p>
      <h2 className="text-base text-text-primary pt-4">Processing Time</h2>
      <p>
        Orders are processed within 1–2 business days. You will receive a
        confirmation email with tracking information once your order ships.
      </p>
      <h2 className="text-base text-text-primary pt-4">Domestic Shipping</h2>
      <p>
        Standard shipping (3–5 business days) is complimentary on orders over
        $50. Express shipping (1–2 business days) is available at checkout.
      </p>
      <h2 className="text-base text-text-primary pt-4">International Shipping</h2>
      <p>
        We ship to select international destinations. Delivery times vary by
        location, typically 7–14 business days. Import duties and taxes may
        apply and are the responsibility of the recipient.
      </p>
      <h2 className="text-base text-text-primary pt-4">Packaging</h2>
      <p>
        All orders ship in minimal, recyclable packaging designed to protect
        product integrity while minimizing environmental impact.
      </p>
    </PolicyLayout>
  );
}
