import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { CartLink } from "@/components/layout/CartLink";

const navLinks = [
  { href: "/#products", label: "Products" },
  { href: "/#benefits", label: "Benefits" },
  { href: "/faqs", label: "FAQ" },
] as const;

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        <Logo height={32} />

        <nav className="flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="hidden text-xs tracking-[0.14em] uppercase text-text-muted transition-colors hover:text-text-primary md:block"
            >
              {link.label}
            </Link>
          ))}
          <CartLink />
        </nav>
      </div>
    </header>
  );
}
