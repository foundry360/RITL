import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

const footerLinks = {
  policies: [
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/return-policy", label: "Return Policy" },
    { href: "/shipping-policy", label: "Shipping Policy" },
  ],
  support: [
    { href: "/faqs", label: "FAQs" },
    { href: "/support", label: "Support" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-graphite bg-near-black">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Logo height={28} />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-text-muted">
              Functional Coffee is cognitive wellness for the modern ritual.
              Precision-formulated for focus, clarity, and daily performance.
            </p>
          </div>

          <div>
            <h3 className="text-xs tracking-[0.18em] uppercase text-text-secondary mb-6">
              Policies
            </h3>
            <ul className="space-y-4">
              {footerLinks.policies.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-muted transition-colors hover:text-text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs tracking-[0.18em] uppercase text-text-secondary mb-6">
              Help
            </h3>
            <ul className="space-y-4">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-muted transition-colors hover:text-text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs tracking-[0.18em] uppercase text-text-secondary mb-6">
              Contact
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              hello@functionalcoffee.com
            </p>
            <p className="mt-4 text-sm text-text-muted leading-relaxed">
              Mon–Fri, 9am–6pm EST
            </p>
          </div>
        </div>

        <div className="mt-16 space-y-6 border-t border-graphite pt-8">
          <p className="max-w-4xl text-[10px] leading-relaxed text-text-muted">
            The statements made on this website have not been evaluated by the
            FDA (U.S. Food &amp; Drug Administration). The products sold on this
            website are not intended to diagnose, treat, cure, or prevent any
            disease. The information provided by this website or this company is
            not a substitute for a face-to-face consultation with your physician,
            and should not be construed as individual medical advice.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-text-muted tracking-wide">
              © {new Date().getFullYear()} RITL Coffee. All rights reserved.
            </p>
            <p className="text-xs text-text-muted tracking-wide">
              Ritual In The Loop (RITL)
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
