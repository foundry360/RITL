import Link from "next/link";
import { CartContent } from "@/components/cart/CartContent";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata = {
  title: "Cart | RITL Coffee",
};

export default function CartPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-near-black pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <Link
            href="/#products"
            className="text-xs tracking-[0.14em] uppercase text-text-muted transition-colors hover:text-text-primary"
          >
            ← Continue Shopping
          </Link>

          <div className="mt-8 border-b border-graphite pb-8">
            <p className="text-xs tracking-[0.2em] uppercase text-text-muted">
              Your Cart
            </p>
            <h1 className="mt-2 text-3xl font-light tracking-tight text-text-primary">
              Review & Checkout
            </h1>
          </div>

          <div className="mt-8">
            <CartContent />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
