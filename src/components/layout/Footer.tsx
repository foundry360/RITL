import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { BRAND_COFFEE } from "@/lib/brand";
import { CONTACT_INBOX } from "@/lib/contact/config";

const footerLinks = {
  policies: [
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/terms-of-use", label: "Terms of Use" },
    { href: "/return-policy", label: "Return Policy" },
    { href: "/shipping-policy", label: "Shipping Policy" },
  ],
  certifications: [
    {
      href: "/certifications/mycotoxin-free.pdf",
      label: "Certified Mycotoxin Free",
    },
    {
      href: "/certifications/heavy-metal-free.pdf",
      label: "Certified Heavy Metal Free",
    },
    {
      href: "/certifications/mold-yeast-free.pdf",
      label: "Certified Mold & Yeast Free",
    },
  ],
  support: [
    { href: "/orders/lookup", label: "Track Order" },
    { href: "/faqs", label: "FAQs" },
    { href: "/support", label: "Support" },
  ],
};

function LockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect
        x="4"
        y="9"
        width="12"
        height="8"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-graphite bg-near-black">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="flex flex-col gap-12 sm:grid sm:grid-cols-2 lg:flex lg:flex-row lg:items-start lg:justify-between lg:gap-0">
          <div className="lg:max-w-[220px]">
            <Logo height={36} />
            <p className="mt-6 text-sm leading-relaxed text-text-muted">
              Functional Coffee is cognitive wellness for the modern ritual.
              Precision-formulated for focus, clarity, and daily performance.
            </p>
          </div>

          <div className="shrink-0">
            <h3 className="text-xs tracking-[0.18em] uppercase text-text-secondary mb-6">
              Certifications
            </h3>
            <ul className="space-y-4">
              {footerLinks.certifications.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-text-muted transition-colors hover:text-text-primary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="shrink-0">
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

          <div className="shrink-0">
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

          <div className="shrink-0">
            <h3 className="text-xs tracking-[0.18em] uppercase text-text-secondary mb-6">
              Contact
            </h3>
            <a
              href={`mailto:${CONTACT_INBOX}`}
              className="text-sm text-text-muted leading-relaxed transition-colors hover:text-text-primary"
            >
              {CONTACT_INBOX}
            </a>
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
              © {new Date().getFullYear()} {BRAND_COFFEE}. All rights reserved.
            </p>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 text-xs text-text-muted tracking-wide transition-colors hover:text-text-primary"
            >
              <LockIcon />
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
