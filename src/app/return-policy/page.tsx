import { PolicyLayout } from "@/components/layout/PolicyLayout";
import { CONTACT_INBOX } from "@/lib/contact/config";

export const metadata = {
  title: "Return Policy | Functional Coffee",
};

export default function ReturnPolicyPage() {
  return (
    <PolicyLayout title="Return Policy">
      <p>
        We stand behind the quality of every product. If you are not satisfied
        with your purchase, we offer a straightforward return process.
      </p>
      <h2 className="text-base text-text-primary pt-4">Eligibility</h2>
      <p>
        Returns are accepted within 30 days of delivery for unopened products
        in their original packaging. Opened products may be eligible for store
        credit at our discretion.
      </p>
      <h2 className="text-base text-text-primary pt-4">Process</h2>
      <p>
        To initiate a return, contact {CONTACT_INBOX} with your
        order number. We will provide a prepaid return label for domestic
        orders. Refunds are processed within 5–7 business days of receiving
        your return.
      </p>
      <h2 className="text-base text-text-primary pt-4">Damaged Items</h2>
      <p>
        If your order arrives damaged, contact us within 48 hours with photos.
        We will ship a replacement at no additional cost.
      </p>
    </PolicyLayout>
  );
}
