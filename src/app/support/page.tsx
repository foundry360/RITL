import Link from "next/link";
import { PolicyLayout } from "@/components/layout/PolicyLayout";
import { CONTACT_INBOX } from "@/lib/contact/config";

export const metadata = {
  title: "Support | Functional Coffee",
};

export default function SupportPage() {
  return (
    <PolicyLayout title="Support">
      <p>
        We are here to help with orders, product questions, and anything else
        you need. Our team responds within one business day.
      </p>

      <div className="border border-graphite p-8 mt-4 space-y-6">
        <div>
          <h2 className="text-xs tracking-[0.18em] uppercase text-text-muted mb-2">
            Email
          </h2>
          <a
            href={`mailto:${CONTACT_INBOX}`}
            className="text-text-primary transition-colors hover:text-steel-silver"
          >
            {CONTACT_INBOX}
          </a>
        </div>
        <div>
          <h2 className="text-xs tracking-[0.18em] uppercase text-text-muted mb-2">
            Hours
          </h2>
          <p>Monday – Friday, 9am – 6pm EST</p>
        </div>
        <div>
          <h2 className="text-xs tracking-[0.18em] uppercase text-text-muted mb-2">
            Order Status
          </h2>
          <p>
            <Link
              href="/orders/lookup"
              className="text-steel-silver transition-colors hover:underline"
            >
              Track your order
            </Link>{" "}
            using your email, name, and order reference from your confirmation
            email. No account required.
          </p>
        </div>
      </div>

      <p className="pt-4">
        For returns, see our{" "}
        <Link href="/return-policy" className="text-steel-silver hover:underline">
          Return Policy
        </Link>
        . For shipping details, visit our{" "}
        <Link href="/shipping-policy" className="text-steel-silver hover:underline">
          Shipping Policy
        </Link>
        .
      </p>
    </PolicyLayout>
  );
}
