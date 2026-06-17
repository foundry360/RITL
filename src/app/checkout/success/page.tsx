import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = {
  title: "Order Confirmed | Functional Coffee",
};

export default function CheckoutSuccessPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-near-black pt-24 pb-16">
        <div className="mx-auto max-w-xl px-6 text-center lg:px-8">
          <p className="text-xs tracking-[0.2em] uppercase text-text-muted">
            Order Confirmed
          </p>
          <h1 className="mt-4 text-3xl font-light tracking-tight text-text-primary">
            Thank you.
          </h1>
          <p className="mt-6 text-sm leading-relaxed text-text-secondary">
            Your order has been received. A confirmation email will arrive
            shortly with tracking details once your ritual ships.
          </p>
          <div className="mt-10">
            <ButtonLink href="/">Return Home</ButtonLink>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
