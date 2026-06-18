import Link from "next/link";
import { PolicyLayout } from "@/components/layout/PolicyLayout";

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
            href="mailto:support@getritl.com"
            className="text-text-primary transition-colors hover:text-steel-silver"
          >
            support@getritl.com
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
            Check your confirmation email for tracking information, or reply to
            your order confirmation for assistance.
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
