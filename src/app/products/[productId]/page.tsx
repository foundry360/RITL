import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { CheckoutButton } from "@/components/product/CheckoutButton";
import { ProductAccordions } from "@/components/product/ProductAccordions";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductMedia } from "@/components/product/ProductMedia";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ButtonLink } from "@/components/ui/Button";
import { getProduct } from "@/lib/stripe/products";
import { cn } from "@/lib/utils";

interface ProductPageProps {
  params: Promise<{ productId: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { productId } = await params;
  const product = getProduct(productId);
  if (!product) return { title: "Product | Functional Coffee" };
  return {
    title: `${product.name} | Functional Coffee`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = await params;
  const product = getProduct(productId);

  if (!product) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-near-black pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Link
            href="/#products"
            className="text-xs tracking-[0.14em] uppercase text-text-muted transition-colors hover:text-text-primary"
          >
            ← All Products
          </Link>

          <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-16">
            {product.gallery ? (
              <ProductGallery product={product} />
            ) : (
              <ProductMedia
                product={product}
                aspectClassName="aspect-[4/5]"
                className="rounded-[4px] border border-graphite"
              />
            )}

            <div className="flex flex-col justify-center">
              <span
                className={cn(
                  "text-[10px] tracking-[0.2em] uppercase",
                  product.variant === "focus"
                    ? "text-steel-silver"
                    : "text-violet-gray"
                )}
              >
                {product.tagline}
              </span>
              <h1 className="mt-3 text-4xl font-light tracking-tight text-text-primary">
                {product.name}
              </h1>
              <p className="mt-2 text-2xl font-light text-text-secondary tabular-nums">
                {product.priceLabel}
              </p>
              <p className="mt-6 text-base leading-relaxed text-text-secondary">
                {product.longDescription}
              </p>

              <div className="mt-8">
                <ProductAccordions product={product} />
              </div>

              <div className="mt-10 flex flex-wrap gap-3">
                <AddToCartButton productId={product.id} />
                <CheckoutButton productId={product.id} />
                <ButtonLink href="/#products" variant="outline">
                  Continue Shopping
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
