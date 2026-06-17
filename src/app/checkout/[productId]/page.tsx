import Link from "next/link";
import { notFound } from "next/navigation";
import { EmbeddedCheckoutForm } from "@/components/product/EmbeddedCheckoutForm";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getProduct, type ProductId } from "@/lib/stripe/products";

interface CheckoutPageProps {
  params: Promise<{ productId: string }>;
}

export async function generateMetadata({ params }: CheckoutPageProps) {
  const { productId } = await params;
  const product = getProduct(productId);
  if (!product) return { title: "Checkout | Functional Coffee" };
  return {
    title: `Checkout | ${product.name} | Functional Coffee`,
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { productId } = await params;
  const product = getProduct(productId);

  if (!product) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-near-black pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <Link
            href={`/products/${product.id}`}
            className="text-xs tracking-[0.14em] uppercase text-text-muted transition-colors hover:text-text-primary"
          >
            ← Back to {product.name}
          </Link>

          <div className="mt-8 border-b border-graphite pb-8">
            <p className="text-xs tracking-[0.2em] uppercase text-text-muted">
              Secure Checkout
            </p>
            <h1 className="mt-2 text-3xl font-light tracking-tight text-text-primary">
              {product.name}
            </h1>
            <p className="mt-2 text-text-secondary">{product.priceLabel}</p>
          </div>

          <div className="mt-8">
            <EmbeddedCheckoutForm productId={product.id as ProductId} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
