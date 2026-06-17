import { PolicyLayout } from "@/components/layout/PolicyLayout";

export const metadata = {
  title: "Privacy Policy | Functional Coffee",
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout title="Privacy Policy">
      <p>
        Functional Coffee (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is
        committed to protecting your privacy. This policy describes how we
        collect, use, and safeguard your personal information.
      </p>
      <h2 className="text-base text-text-primary pt-4">Information We Collect</h2>
      <p>
        We collect information you provide directly, including name, email
        address, shipping address, and payment information processed securely
        through Stripe. We also collect standard analytics data to improve our
        service.
      </p>
      <h2 className="text-base text-text-primary pt-4">How We Use Your Information</h2>
      <p>
        Your information is used to process orders, communicate about your
        purchases, improve our products, and send marketing communications when
        you have opted in. We never sell your personal data to third parties.
      </p>
      <h2 className="text-base text-text-primary pt-4">Data Security</h2>
      <p>
        We implement industry-standard security measures. Payment processing is
        handled entirely by Stripe and we do not store credit card details on
        our servers.
      </p>
      <h2 className="text-base text-text-primary pt-4">Contact</h2>
      <p>
        For privacy-related inquiries, contact us at privacy@functionalcoffee.com.
      </p>
    </PolicyLayout>
  );
}
