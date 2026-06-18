import Link from "next/link";
import { PolicyLayout } from "@/components/layout/PolicyLayout";
import { BRAND_COFFEE, BRAND_NAME } from "@/lib/brand";
import { CONTACT_INBOX } from "@/lib/contact/config";

export const metadata = {
  title: `Terms of Use | ${BRAND_COFFEE}`,
};

export default function TermsOfUsePage() {
  return (
    <PolicyLayout title="Terms of Use">
      <p>
        These Terms of Use (&quot;Terms&quot;) govern your access to and use of
        the {BRAND_COFFEE} website at getritl.com and related services
        (collectively, the &quot;Service&quot;) operated by {BRAND_COFFEE}
        (&quot;{BRAND_NAME},&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
        By accessing or using the Service, placing an order, or creating a
        subscription, you agree to these Terms. If you do not agree, do not use
        the Service.
      </p>

      <h2 className="text-base text-text-primary pt-4">1. Eligibility</h2>
      <p>
        You must be at least 18 years old and capable of forming a binding
        contract to use the Service and purchase our products. By using the
        Service, you represent that you meet these requirements and that all
        information you provide is accurate and complete.
      </p>

      <h2 className="text-base text-text-primary pt-4">
        2. Products &amp; Health Information
      </h2>
      <p>
        {BRAND_NAME} offers functional coffee and related wellness products. Product
        descriptions, imagery, and marketing materials are provided for
        informational purposes. We strive to display products accurately, but
        colors, packaging, and presentation may vary slightly.
      </p>
      <p>
        Our products are not intended to diagnose, treat, cure, or prevent any
        disease. Statements on this website have not been evaluated by the U.S.
        Food and Drug Administration. Consult a qualified healthcare
        professional before use if you are pregnant, nursing, taking medication,
        or have a medical condition. You are responsible for determining whether
        our products are appropriate for you.
      </p>

      <h2 className="text-base text-text-primary pt-4">3. Orders &amp; Payment</h2>
      <p>
        When you place an order, you offer to purchase the selected products
        subject to these Terms. We reserve the right to refuse or cancel any
        order for any reason, including product availability, errors in pricing
        or product information, suspected fraud, or restrictions on quantities.
      </p>
      <p>
        All prices are listed in U.S. dollars unless otherwise stated. Applicable
        taxes, shipping fees, and other charges are calculated at checkout. Payment
        is processed securely through Stripe. By submitting payment information,
        you authorize us and our payment processor to charge your selected payment
        method for the total order amount.
      </p>
      <p>
        Order confirmation does not guarantee acceptance. A contract is formed when
        we accept your order and process payment. You will receive an order
        confirmation by email when your purchase is complete.
      </p>

      <h2 className="text-base text-text-primary pt-4">4. Subscriptions</h2>
      <p>
        {BRAND_NAME} offers optional subscription plans that renew automatically every{" "}
        <strong className="font-medium text-text-primary">4 weeks</strong> at the
        subscription price displayed at checkout (currently a 15% savings compared
        to one-time purchase pricing, where applicable). By enrolling in a
        subscription, you authorize recurring charges to your payment method on
        each billing cycle until you cancel.
      </p>
      <p>
        Subscription renewals are billed every 4 weeks from the date of your
        initial subscription order. Each renewal shipment is subject to
        applicable taxes and shipping charges shown at checkout or on your
        receipt. Product substitutions may occur if an item is unavailable; we
        will contact you when possible before substituting.
      </p>
      <p>
        You may pause, skip, or cancel your subscription at any time by
        contacting{" "}
        <a
          href={`mailto:${CONTACT_INBOX}`}
          className="text-steel-silver transition-colors hover:underline"
        >
          {CONTACT_INBOX}
        </a>
        . To avoid being charged for the next billing cycle, submit cancellation
        requests at least 48 hours before your next scheduled renewal date.
        Cancellations take effect at the end of the current paid billing period
        unless otherwise stated in our confirmation.
      </p>
      <p>
        We may change subscription pricing or delivery terms with reasonable
        advance notice. Continued use of a subscription after notice constitutes
        acceptance of updated terms, or you may cancel before the change takes
        effect.
      </p>

      <h2 className="text-base text-text-primary pt-4">5. Shipping &amp; Delivery</h2>
      <p>
        Shipping times, carriers, and fees are described in our{" "}
        <Link
          href="/shipping-policy"
          className="text-steel-silver transition-colors hover:underline"
        >
          Shipping Policy
        </Link>
        . Risk of loss and title for products pass to you upon delivery to the
        carrier. We are not responsible for delays caused by carriers, customs,
        weather, or events outside our reasonable control.
      </p>

      <h2 className="text-base text-text-primary pt-4">6. Returns &amp; Refunds</h2>
      <p>
        Returns and refunds are governed by our{" "}
        <Link
          href="/return-policy"
          className="text-steel-silver transition-colors hover:underline"
        >
          Return Policy
        </Link>
        , which is incorporated into these Terms by reference. Subscription
        orders are subject to the same return eligibility requirements unless
        otherwise stated at the time of purchase.
      </p>

      <h2 className="text-base text-text-primary pt-4">
        7. Account Information &amp; Communications
      </h2>
      <p>
        You agree to provide current, complete, and accurate purchase and contact
        information. You are responsible for maintaining access to the email
        address associated with your orders. We may send transactional messages
        related to orders, subscriptions, shipping, and account activity. Marketing
        communications are sent only where permitted by law and in accordance
        with our{" "}
        <Link
          href="/privacy-policy"
          className="text-steel-silver transition-colors hover:underline"
        >
          Privacy Policy
        </Link>
        .
      </p>

      <h2 className="text-base text-text-primary pt-4">
        8. Intellectual Property
      </h2>
      <p>
        All content on the Service—including text, graphics, logos, product
        names, images, design, and software—is owned by {BRAND_NAME} or its licensors
        and is protected by intellectual property laws. You may not copy,
        reproduce, distribute, modify, or create derivative works from any
        part of the Service without our prior written consent, except for
        limited personal, non-commercial use.
      </p>

      <h2 className="text-base text-text-primary pt-4">9. Prohibited Conduct</h2>
      <p>
        You agree not to misuse the Service. Prohibited activities include,
        without limitation: attempting to gain unauthorized access to our
        systems; interfering with site operation; using automated tools to scrape
        or harvest data; submitting false or fraudulent orders; reselling
        products in violation of applicable law; or using the Service in any way
        that violates these Terms or applicable law.
      </p>

      <h2 className="text-base text-text-primary pt-4">10. Disclaimers</h2>
      <p>
        THE SERVICE AND ALL PRODUCTS ARE PROVIDED ON AN &quot;AS IS&quot; AND
        &quot;AS AVAILABLE&quot; BASIS TO THE FULLEST EXTENT PERMITTED BY LAW.
        WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING IMPLIED
        WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
        NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE
        UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
      </p>

      <h2 className="text-base text-text-primary pt-4">
        11. Limitation of Liability
      </h2>
      <p>
        TO THE FULLEST EXTENT PERMITTED BY LAW, {BRAND_NAME} AND ITS OFFICERS,
        DIRECTORS, EMPLOYEES, AND AGENTS WILL NOT BE LIABLE FOR ANY INDIRECT,
        INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
        PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE OR
        PURCHASE OF PRODUCTS. OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF
        OR RELATING TO THESE TERMS OR YOUR USE OF THE SERVICE WILL NOT EXCEED
        THE AMOUNT YOU PAID TO {BRAND_NAME} FOR THE PRODUCTS GIVING RISE TO THE CLAIM
        IN THE TWELVE (12) MONTHS PRECEDING THE EVENT.
      </p>
      <p>
        Some jurisdictions do not allow certain limitations of liability, so some
        of the above limitations may not apply to you.
      </p>

      <h2 className="text-base text-text-primary pt-4">12. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless {BRAND_NAME} and its affiliates from
        any claims, damages, losses, or expenses (including reasonable attorneys&apos;
        fees) arising from your violation of these Terms, misuse of the Service,
        or violation of any third-party rights.
      </p>

      <h2 className="text-base text-text-primary pt-4">
        13. Governing Law &amp; Disputes
      </h2>
      <p>
        These Terms are governed by the laws of the State of Delaware, without
        regard to conflict-of-law principles. Any dispute arising from these Terms
        or the Service will be resolved in the state or federal courts located in
        Delaware, and you consent to personal jurisdiction in those courts.
      </p>
      <p>
        Before filing a claim, you agree to contact us at {CONTACT_INBOX} to
        attempt to resolve the dispute informally.
      </p>

      <h2 className="text-base text-text-primary pt-4">14. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. The revised version will be
        posted on this page with an updated effective date. Material changes may
        also be communicated by email or site notice where appropriate. Your
        continued use of the Service after changes become effective constitutes
        acceptance of the revised Terms.
      </p>

      <h2 className="text-base text-text-primary pt-4">15. Contact</h2>
      <p>
        Questions about these Terms may be directed to{" "}
        <a
          href={`mailto:${CONTACT_INBOX}`}
          className="text-steel-silver transition-colors hover:underline"
        >
          {CONTACT_INBOX}
        </a>
        .
      </p>
      <p className="text-text-muted">Effective date: June 16, 2026</p>
    </PolicyLayout>
  );
}
