import { CheckoutPageShell } from "@/components/checkout/CheckoutPageShell";
import { SecureCheckout } from "@/components/checkout/SecureCheckout";
import { notFound } from "next/navigation";
import {
  getProduct,
  type ProductId,
  type PurchaseType,
} from "@/lib/stripe/products";

interface CheckoutPageProps {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ purchaseType?: string }>;
}

function parsePurchaseType(value?: string): PurchaseType {
  return value === "subscription" ? "subscription" : "one-time";
}

export async function generateMetadata({ params }: CheckoutPageProps) {
  const { productId } = await params;
  const product = getProduct(productId);
  if (!product) return { title: "Secure Checkout | RITL Coffee" };
  return {
    title: `Secure Checkout | ${product.name} | RITL Coffee`,
  };
}

export default async function ProductCheckoutPage({
  params,
  searchParams,
}: CheckoutPageProps) {
  const { productId } = await params;
  const { purchaseType: purchaseTypeParam } = await searchParams;
  const product = getProduct(productId);

  if (!product) {
    notFound();
  }

  const purchaseType = parsePurchaseType(purchaseTypeParam);
  const items = [
    { productId: product.id as ProductId, quantity: 1, purchaseType },
  ];

  return (
    <CheckoutPageShell
      step="payment"
      backHref={`/products/${product.id}`}
      backLabel={`Back to ${product.name}`}
      title="Complete your order"
      description="Enter your shipping and payment details below. Your information is encrypted and processed securely by Stripe."
    >
      <SecureCheckout
        items={items}
        showEditLink={false}
        cancelHref={`/products/${product.id}`}
      />
    </CheckoutPageShell>
  );
}
